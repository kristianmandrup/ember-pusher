App.Pusher = Ember.Object.extend({
  key: null,

  init: function() {
    var _this = this;
    this.service = new Pusher(this.get("key"));

    this.service.connection.bind('connected', function() { _this.connected(); });
    this.service.bind_all(function(eventName, data) { _this.handleEvent(eventName, data); });
  },

  connected: function() {
    this.socketId = this.service.connection.socket_id;
    this.addSocketIdToXHR();
  },

  // add X-Pusher-Socket header so we can exclude the sender from their own actions
  // http://pusher.com/docs/server_api_guide/server_excluding_recipients
  addSocketIdToXHR: function() {
    var _this = this;
    Ember.$.ajaxPrefilter(function(options, originalOptions, xhr) {
      return xhr.setRequestHeader('X-Pusher-Socket', _this.socketId);
    });
  },

  subscribe: function(channel) {
    return this.service.subscribe(channel);
  },

  unsubscribe: function(channel) {
    return this.service.unsubscribe(channel);
  },

  handleEvent: function(eventName, data) {
    var router, unhandled;

    // ignore pusher internal events
    if (eventName.match(/^pusher:/)) { return; }

    router = this.get("container").lookup("router:main");
    try {
      router.send(eventName, data);
    } catch (e) {
      unhandled = e.message.match(/Nothing handled the event/);
      if (!unhandled) { throw e };
    }
  }
});
