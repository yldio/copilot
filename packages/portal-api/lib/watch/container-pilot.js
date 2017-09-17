'use strict';

const Events = require('events');
const Flatten = require('lodash.flatten');
const Triton = require('triton');
const VAsync = require('vasync');
const Wreck = require('wreck');
const CIDRMatcher = require('cidr-matcher');
const ForceArray = require('force-array');
const Get = require('lodash.get');
const Uniq = require('lodash.uniq');
const Hasha = require('hasha');
const ParamCase = require('param-case');
const Queue = require('./queue');

module.exports = class ContainerPilotWatcher extends Events {
  constructor (options) {
    super();

    options = options || {};

    // todo assert options
    this._data = options.data;
    this._frequency = options.frequency || 1000;

    const TritonClient = options.Triton || Triton;

    TritonClient.createClient({
      profile: {
        url: options.url || process.env.SDC_URL,
        account: options.account || process.env.SDC_ACCOUNT,
        keyId: options.keyId || process.env.SDC_KEY_ID
      }
    }, (err, client) => {
      if (err) {
        this.emit('error', err);
        return;
      }

      this._triton = client.cloudapi;
    });
  }

  poll () {
    if (this._timeoutId) {
      return;
    }

    this._timeoutId = setTimeout(() => {
      this.check((err) => {
        if (err) {
          this.emit('error', err);
        }

        delete this._timeoutId;
        this.poll();
      });
    }, this._frequency);
  }

  _getDeploymentGroups (cb) {
    const getInstances = (service, next) => {
      service.instances({}, (err, instances) => {
        if (err) {
          return next(err);
        }

        next(null, Object.assign({}, service, {
          instances
        }));
      });
    };

    const getServices = (deploymentGroup, next) => {
      deploymentGroup.services({}, (err, services) => {
        if (err) {
          return next(err);
        }

        if (!services || !services.length) {
          return next();
        }

        VAsync.forEachParallel({
          inputs: services,
          func: getInstances
        }, (err, result) => {
          if (err) {
            return next(err);
          }

          next(null, Object.assign({}, deploymentGroup, {
            services: result.successes
          }));
        });
      });
    };

    const handleDeploymentGroups = (err, deploymentGroups) => {
      if (err) {
        return cb(err);
      }

      VAsync.forEachParallel({
        inputs: deploymentGroups,
        func: getServices
      }, (err, result) => {
        cb(err, result.successes);
      });
    };

    const getDeploymentGroups = (err, portal) => {
      if (err || !portal) {
        return cb(err);
      }

      portal.deploymentGroups({}, handleDeploymentGroups);
    };

    this._data.getPortal({}, getDeploymentGroups);
  }

  _fetchInstanceStatus (instance, cb) {
    const { machineId } = instance;

    const handleStatus = (status) => {
      if (!status) {
        return;
      }

      const services = ForceArray(status.Services).filter(({ Name }) => {
        return Name !== 'containerpilot';
      });

      instance.cp = {
        status,
        Services: services,
        Watches: status.Watches
      };

      return instance;
    };

    const fetchStatus = (ip, next) => {
      Wreck.get(`http://${ip}:9090/status`, {
        timeout: 2000,    // 2 seconds
        json: 'force'
      }, (err, res, status) => {
        if (err) {
          return next(err);
        }

        next(null, status);
      });
    };

    this._triton.getMachine(machineId, (err, machine) => {
      if (err) {
        this.emit('error', err);
        return cb();
      }

      if (!machine || !Array.isArray(machine.ips)) {
        return cb();
      }

      VAsync.forEachParallel({
        func: fetchStatus,
        inputs: machine.ips
      }, (err, results) => {
        if (err || !results.successes || !results.successes.length) {
          return cb(err);
        }

        const instance = handleStatus(results.successes[0]);
        return cb(null, instance);
      });
    });
  }

  _fetchServiceStatus (service, cb) {
    VAsync.forEachParallel({
      inputs: service.instances,
      func: (instance, next) => {
        this._fetchInstanceStatus(instance, next);
      }
    }, (err, results) => {
      if (err) {
        this.emit('error', err);
      }

      cb(null, Object.assign({}, service, {
        instances: ForceArray((results || {}).successes)
      }));
    });
  }

  _fetchDeploymentGroupStatus (dg, cb) {
    if (!dg || !dg.services || !dg.services.length) {
      return cb();
    }

    VAsync.forEachParallel({
      inputs: dg.services,
      func: (service, next) => {
        this._fetchServiceStatus(service, next);
      }
    }, (err, results) => {
      if (err) {
        this.emit('error', err);
      }

      cb(null, Object.assign({}, dg, {
        services: ForceArray((results || {}).successes)
      }));
    });
  }

  _saveInstance ({ id, healthy, watches, jobs }, cb) {
    if (!id) {
      return cb();
    }

    this._data.updateInstance({
      id,
      healthy,
      watches,
      jobs
    }, cb);
  }

  _saveService ({ id, instances, connections, branches }, cb) {
    if (!id) {
      return cb();
    }

    VAsync.forEachParallel({
      inputs: instances,
      func: (instance, next) => {
        this._saveInstance(instance, next);
      }
    }, (err) => {
      if (err) {
        return cb(err);
      }

      this._data.updateService({
        id,
        connections,
        branches
      }, cb);
    });
  }

  _saveDeploymentGroup (dg, cb) {
    VAsync.forEachParallel({
      inputs: dg.services,
      func: (service, next) => {
        this._saveService(service, next);
      }
    }, cb);
  }

  static _resolveServiceConnections ({ services, service }) {
    const watches = Uniq(
      Flatten(
        ForceArray(service.instances).map(({ watches }) => {
          return watches;
        })
      )
    );

    return watches
      .map((jobName) => {
        return services.reduce((serviceId, service) => {
          if (serviceId) {
            return serviceId;
          }

          const thisServiceJobs = Uniq(
            Flatten(
              ForceArray(service.instances).map(({ jobs }) => {
                return jobs;
              })
            )
          );

          if (thisServiceJobs.indexOf(jobName) >= 0) {
            return service.id;
          }

          return serviceId;
        }, null);
      })
      .filter(Boolean)
      .filter((serviceId) => {
        return service.id !== serviceId;
      });
  }

  static _resolveInstanceHealth ({ name }, instance) {
    if (!instance || !instance.cp) {
      return 'UNAVAILABLE';
    }

    const jobNames = Get(instance, 'cp.Services');

    const serviceJobs = jobNames.filter(({ Name }) => {
      return Name === name;
    });

    if (serviceJobs.length) {
      return serviceJobs.shift().Status.toUpperCase();
    }

    const almostJobNameRegexp = new RegExp(`${name}`, 'ig');
    const almostServiceJobs = jobNames.filter(({ Name }) => {
      return almostJobNameRegexp.test(Name);
    });

    if (almostServiceJobs.length) {
      return almostServiceJobs.shift().Status.toUpperCase();
    }

    return 'UNKNOWN';
  }

  static _resolveServiceBranches ({ name, slug, instances }) {
    if (instances.length <= 1) {
      return [];
    }

    const deviantJobNames = Uniq(Flatten(instances.map(({ jobs }) => {
      return Flatten(jobs.filter((jobName) => {
        return new RegExp(`${name}-.*`).test(jobName);
      }));
    })));

    if (!deviantJobNames || !deviantJobNames.length) {
      return [];
    }

    const defaultBranch = instances.reduce((service, { id, jobs }) => {
      if (jobs.indexOf(name) >= 0) {
        return Object.assign(service, {
          instances: service.instances.concat(id)
        });
      }

      return service;
    }, {
      name: name,
      slug: slug,
      instances: []
    });

    defaultBranch.id = Hasha(JSON.stringify(defaultBranch));

    const branches = instances.reduce((branches, { id, jobs }) => {
      if (defaultBranch.instances.indexOf(id) >= 0) {
        return branches;
      }

      const branchName = jobs
        .filter((jobName) => {
          return deviantJobNames.indexOf(jobName) >= 0;
        })
        .shift();

      if (!branches[branchName]) {
        branches[branchName] = {
          name: branchName,
          slug: ParamCase(branchName),
          instances: []
        };

        branches[branchName].id = Hasha(JSON.stringify(branches[branchName]));
      }

      branches[branchName].instances.push(id);

      return branches;
    }, {});

    return Object.values(branches).concat(defaultBranch);
  }

  static _resolveDeploymentGroups (dgs) {
    return dgs
      .filter(Boolean)
      .map((dg) => {
        return Object.assign({}, dg, {
          services: ForceArray(dg.services).map((service) => {
            return Object.assign({}, service, {
              instances: ForceArray(service.instances).map((instance) => {
                const watches = Get(instance, 'cp.Watches', []);
                const jobs = Get(instance, 'cp.Services', []).map(({ Name }) => {
                  return Name;
                });

                return Object.assign({}, instance, {
                  healthy: ContainerPilotWatcher._resolveInstanceHealth(service, instance),
                  jobs,
                  watches
                });
              })
            });
          })
        });
      })
      .map((dg) => {
        return Object.assign({}, dg, {
          services: ForceArray(dg.services).map((service) => {
            return Object.assign({}, service, {
              branches: ContainerPilotWatcher._resolveServiceBranches(service),
              connections: ContainerPilotWatcher._resolveServiceConnections({
                services: dg.services,
                service
              })
            });
          })
        });
      });
  }

  check (cb) {
    if (!this._triton) {
      return cb();
    }

    const handleStatuses = (err, results) => {
      if (err) {
        this.emit('error', err);
      }

      const dgs = ContainerPilotWatcher._resolveDeploymentGroups(
        ForceArray((results || {}).successes)
      );

      VAsync.forEachParallel({
        inputs: dgs,
        func: (dg, next) => {
          Queue(dg.id, () => {
            return new Promise((resolve) => {
              this._saveDeploymentGroup(dg, (err) => {
                resolve();
                next(err);
              });
            });
          });
        }
      }, (err) => {
        if (err) {
          this.emit('error', err);
        }

        cb(null, dgs);
      });
    };

    const fetchStatuses = (err, dgs) => {
      if (err) {
        this.emit('error', err);
        return cb();
      }

      if (!dgs || !dgs.length) {
        return cb();
      }

      VAsync.forEachParallel({
        inputs: dgs,
        func: (dg, next) => {
          this._fetchDeploymentGroupStatus(dg, next);
        }
      }, handleStatuses);
    };

    this._getDeploymentGroups(fetchStatuses);
  }
};

