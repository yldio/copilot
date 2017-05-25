const state = {
  ui: {
    sections: {
      deploymentGroups: [
        {
          pathname: 'services',
          name: 'Services'
        },
        {
          pathname: 'instances',
          name: 'Instances'
        },
        {
          pathname: 'manifest',
          name: 'Manifest'
        }
      ],
      services: [
        {
          pathname: 'instances',
          name: 'Instances'
        }
      ]
    }
  }
};

export default state;