import environment from './environment';
import I18NXHRBackend from 'i18next-xhr-backend';

//Configure Bluebird Promises.
//Note: You may want to use environment-specific configuration.
Promise.config({
  warnings: {
    wForgottenReturn: false
  }
});

export function configure(aurelia) {
  aurelia.use
    .standardConfiguration()
    .plugin('aurelia-i18n', (instance) => {
      instance.i18next.use(I18NXHRBackend);
      return instance.setup({
        backend: {},    // Loadpath for XHR configured elsewhere, but this is still needed
        lowerCaseLng: true,
        ns: [],
        lng: 'en-gb',
        fallbackLng: 'en',
        attributes: ['t'],
        debug: true
      });
    });
    //.feature('resources');  // Investigate why they did this step... BB

  if (environment.debug) {
    aurelia.use.developmentLogging();
  }

  if (environment.testing) {
    aurelia.use.plugin('aurelia-testing');
  }

  aurelia.start().then(() => aurelia.setRoot('routes/root/root', document.body));
}
