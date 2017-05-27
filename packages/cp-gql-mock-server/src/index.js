const schema = require('joyent-cp-gql-schema');
const graphi = require('graphi');
const Good = require('good');
const Hapi = require('hapi');
const resolvers = require('./resolvers');

const server = new Hapi.Server({
  debug: {
    log: ['error'],
    request: ['error']
  }
});

const handlerError = err => {
  if (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  }
};

server.connection({
  port: 3000
});

server.register(
  [
    {
      register: Good,
      options: {
        reporters: {
          console: [
            {
              module: 'good-squeeze',
              name: 'Squeeze',
              args: [{ log: '*', response: '*' }]
            },
            {
              module: 'good-console'
            },
            'stdout'
          ]
        }
      }
    },
    {
      register: graphi,
      options: {
        graphqlPath: '/graphql',
        graphiqlPath: '/graphiql',
        schema,
        resolvers
      }
    }
  ],
  err => {
    handlerError(err);

    server.start(err => {
      handlerError(err);
      // eslint-disable-next-line no-console
      console.log(`server started at http://0.0.0.0:${server.info.port}`);
    });
  }
);
