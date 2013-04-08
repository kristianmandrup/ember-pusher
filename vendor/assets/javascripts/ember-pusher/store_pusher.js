App.StorePusher = App.Pusher.extend({
  handlePusherEvent: function(eventName, data) {
    var type, id;

    // ignore pusher internal events
    if (eventName.match(/^pusher:/)) { return; }

    type = eventName.split('.')[0].replace(/::/, '.')
    data = data[type] if data[type]
    id   = data['id']

    if (isModelEvent('create'))   { this.store().wasCreated(type, data) }
    if (isModelEvent('update'))   { this.store().wasUpdated(type, id, data) }
    if (isModelEvent('destroy'))  { this.store().wasDestroyed(type, id) }
  },

  isModelEvent: function(eventName, name) {
    var eventMatchExpr = new RegExp("\." + name + "$");
    return eventName.match(eventMatchExpr);
  },

  store: function() {
    return this.get("container").lookup("store:main");
  }
});

App.StorePusherActivation = Ember.Mixin.create({
  pusher_channel: "rest-channel",
  // subscribe/unsubscribe to a pusher channel
  // when we enter/exit this part of the app
  activate: function() {
    this.get("store_pusher").subscribe(this.get('pusher_channel'));
  },
  deactivate: function() {
    this.get("store_pusher").unsuscribe(this.get('pusher_channel'));
  }
}

App.StorePusherEventHandler = Ember.Mixin.create({
  wasCreated: function(type, data) {
    this.createRecord(type, data);
  },

  wasUpdated: function(type, id, data) {    
    var record = this.findTheRecord(type, id)
    if (isRecord(record)) {
      record.reload();
    }      
  },

  wasDestroyed: function(type, id) {
    var record = this.findTheRecord(type, id)
    if (isRecord(record)) {
      record.deleteRecord();
    }      
  },

  isRecord: function(obj) {
    return Ember.typeOf(obj) == "instance";
  },  

  findTheRecord: function(type, id) {
    try {
      return this.find(type, id);  
    } catch (e) {
      return null;
    }    
  }    
 });

Ember.Application.initializer({
  name: "store_pusher",
  initialize: function(container, application) {
    // use the same instance of Pusher everywhere in the app
    container.optionsForType('store_pusher', { singleton: true });

    // register 'pusher:main' as our Pusher object
    container.register('store_pusher', 'main', application.StorePusher);

    // inject the Pusher object into all controllers and routes
    container.typeInjection('store', 'store_pusher', 'store_pusher:main');
  }
});
