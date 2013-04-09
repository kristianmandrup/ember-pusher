App.StorePusher = App.Pusher.extend({
  handlePusherEvent: function(eventName, data) {
    var type, id;

    // ignore pusher internal events
    if (eventName.match(/^pusher:/)) { return; }

    type = eventName.split('.')[0].replace(/::/, '.');
    data = data[type] if data[type];
    id   = data['id'];

    if (isModelEvent('create'))   { this.store().wasCreated(type, data) }
    if (isModelEvent('update'))   { this.store().wasUpdated(type, id, data) }
    if (isModelEvent('destroy'))  { this.store().wasDestroyed(type, id, data) }
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

// Simulate server sync
// We simply notify the store that the server "did" the specified event on the model
// This is very similar to how the Fixture adapter works, except no reason to simulate a remote call.
DS.Adapter.reopen({
  hasCreatedRecord: function(store, type, record, data) {
    var json = this.mockJSON(type, record);  
    this.didCreateRecord(store, type, record, json);
  },

  hasUpdatedRecord: function(store, type, record, data) {
    var json = this.mockJSON(type, record);
    this.didUpdateRecord(store, type, record, json);
  },

  hasDeletedRecord: function(store, type, record, data) {    
    var json = this.mockJSON(type, record);
    this.didDeleteRecord(store, type, json);
  },

  findIt: function(store, type, payload, id) {
    this.didFindRecord(store, type, payload, id);
  }

  didFindRecord: function(store, type, payload, id) {
    var loader = DS.loaderFor(store);

    loader.load = function(type, data, prematerialized) {
      prematerialized = prematerialized || {};
      prematerialized.id = id;

      return store.load(type, data, prematerialized);
    };

    get(this, 'serializer').extractOneRecord(loader, payload, type);
  }  
});

DS.RESTSerializer.reopen({
  extractOneRecord: function(loader, fixture, type) {
    this.extractRecordRepresentation(loader, type, fixture);
  }
});  

App.StorePusherEventHandler = Ember.Mixin.create({
  wasCreated: function(type, id, data) {
    var record = this.findTheRecord(type, data, id);
    if (this.isRecord(record)) {
      this.get('adapter').hasCreatedRecord(this, type, record, data);  
    }    
  },

  wasUpdated: function(type, id, data) {    
    var record = this.findTheRecord(type, data, id);
    if (this.isRecord(record)) {
      this.get('adapter').hasUpdatedRecord(this, type, record, data);
    }
  },

  wasDestroyed: function(type, id, data) {
    var record = this.findTheRecord(type, data, id);
    if (this.isRecord(record)) {
      this.get('adapter').hasDeletedRecord(this, type, record, data);
    }
  },

  isRecord: function(obj) {
    return Ember.typeOf(obj) == "instance";
  },  

  findTheRecord: function(type, payload, id) {
    try {
      return this.get('adapter').findIt(this, type, payload, id);  
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
