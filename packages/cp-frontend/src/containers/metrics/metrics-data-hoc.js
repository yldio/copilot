import React, { Component } from 'react';
import { graphql } from 'react-apollo';
import find from 'lodash.find';
import uniqBy from 'lodash.uniqby';
import get from 'lodash.get';
import moment from 'moment';

export const MetricNames = [
  'AVG_MEM_BYTES',
  'AVG_LOAD_PERCENT',
  'AGG_NETWORK_BYTES'
];

export const withServiceMetricsPolling = ({
  pollingInterval = 1000, // In milliseconds
  getPreviousEnd = () =>
    moment()
      .utc()
      .format()
}) => {
  return WrappedComponent => {
    return class extends Component {
      componentDidMount() {
        this._poll = setInterval(() => {
          const { loading, fetchMoreMetrics } = this.props;
          const previousEnd = getPreviousEnd(this.props);

          if (!loading && previousEnd) {
            fetchMoreMetrics(previousEnd);
          }
        }, pollingInterval); // TODO this is the polling interval - think about amount is the todo I guess...
      }

      componentWillUnmount() {
        clearInterval(this._poll);
      }

      render() {
        return <WrappedComponent {...this.props} />;
      }
    };
  };
};

export const withServiceMetricsGql = ({
  gqlQuery,
  graphDurationSeconds,
  updateIntervalSeconds,
  variables = () => ({}),
  props = () => ({})
}) => {
  const getPreviousMetrics = (
    previousResult,
    serviceId,
    instanceId,
    metricName
  ) => {
    const services = get(previousResult, 'deploymentGroup.services', []);

    if (!services.length) {
      return [];
    }

    const service = find(services, ['id', serviceId]);

    if (!service) {
      return [];
    }

    const instance = find(service.instances, ['id', instanceId]);

    if (!instance) {
      return [];
    }

    const metrics = find(instance.metrics, ['name', metricName]);

    if (!metrics) {
      return [];
    }

    return get(metrics, 'metrics', []);
  };

  const getNextResult = (previousResult, fetchNextResult) => {
    const deploymentGroup = fetchNextResult.deploymentGroup;

    return {
      deploymentGroup: {
        ...deploymentGroup,
        services: deploymentGroup.services.map(service => ({
          ...service,
          instances: service.instances.map(instance => ({
            ...instance,
            metrics: instance.metrics.map(metric => ({
              ...metric,
              metrics: uniqBy(
                getPreviousMetrics(
                  previousResult,
                  service.id,
                  instance.id,
                  metric.name
                ).concat(metric.metrics),
                'time'
              )
            }))
          }))
        }))
      }
    };
  };

  return graphql(gqlQuery, {
    options(props) {
      const params = props.match.params;
      const deploymentGroupSlug = params.deploymentGroup;

      // This is potentially prone to overfetching if we already have data within timeframe and we leave the page then come back to it
      const end = moment();
      const start = moment(end).subtract(
        graphDurationSeconds + updateIntervalSeconds,
        'seconds'
      ); // TODO initial amount of data we wanna get - should be the same as what we display + 15 secs

      return {
        variables: {
          deploymentGroupSlug,
          metricNames: MetricNames,
          start: start.utc().format(),
          end: end.utc().format(),
          ...variables(props)
        }
      };
    },
    props: ({ data: { variables, fetchMore, ...rest } }) => {
      const fetchMoreMetrics = previousEnd => {
        fetchMore({
          variables: {
            ...variables,
            start: previousEnd,
            end: moment()
              .utc()
              .format()
          },
          updateQuery: (
            previousResult,
            { fetchMoreResult, queryVariables }
          ) => {
            return getNextResult(previousResult, fetchMoreResult);
          }
        });
      };

      return {
        fetchMoreMetrics,
        ...props(rest)
      };
    }
  });
};