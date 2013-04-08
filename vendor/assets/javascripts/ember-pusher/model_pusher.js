App.ModelPusher = App.Pusher.extend({
  handleEvent: function(eventName, data) {
    var store, unhandled, type, id;

    // ignore pusher internal events
    if (eventName.match(/^pusher:/)) { return; }

    type = eventName.split('.')[0].replace(/::/, '.')
    data = data[type] if data[type]
    id   = data['id']

    this.set('dsStore', this.get("container").lookup("store"));

    if (isModelEvent('create'))   { this.handleCreate(type, data) }
    if (isModelEvent('update'))   { this.handleUpdate(type, id, data) }
    if (isModelEvent('destroy'))  { this.handleDestroy(type, id) }
  },

  isModelEvent: function(eventName, name) {
    var eventMatchExpr = new RegExp("\." + name + "$");
    return eventName.match(eventMatchExpr);
  },

  handleCreate: function(type, data) {
    this.get('dsStore').createRecord(type, data);
  },

  handleUpdate: function(type, id, data) {    
    var record = this.findRecord(type, id)
    if (record != null) {
      record.reload();
    }      
  },

  handleDestroy: function(type, id) {
    var record = this.findRecord(type, id)
    if (record != null) {
      record.deleteRecord();
    }      
  },

  findRecord: function(type, id) {
    try {
      return this.get('dsStore').find(type, id);  
    } catch (e) {
      return null;
    }    
  }

});