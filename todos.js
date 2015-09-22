/******************** COLLECTIONS SECTION ********************/
Todos = new Meteor.Collection('todos');
Lists = new Meteor.Collection('lists');

/******************** ROUTES SECTION ********************/
Router.configure({ layoutTemplate: 'main' });
Router.route('/register');
Router.route('/login');
Router.route('/',{
  name: 'home', 
  template: 'home' 
});
Router.route('/list/:_id', {
  name: 'listPage',
  template: 'listPage',
  data: function(){
    return Lists.findOne({ _id: this.params._id });
  }
});


if (Meteor.isClient) {
  /******************** HELPERS SECTION ********************/
  Template.todos.helpers({
    'todo': function() {
       return Todos.find({listId: this._id}, {sort: {creatdAt: -1}});
    }
  });

  Template.toDoItem.helpers({
    'checked': function() {
      if (this.completed) {
        return "checked";
      } else {
        return "";
      }
    }
  });

  Template.todosCount.helpers ({
    'totalTodos': function() {
      return Todos.find({listId: this._id}).count();
    },
    'completedTodos': function() {
      return Todos.find({listId: this._id, completed: true }).count();
    }
  });

  Template.lists.helpers({
    'list': function(){
      return Lists.find({}, {sort: {name: 1}});
    }
  });

  /********************EVENTS SECTION********************/
  Template.addTodo.events({
    'submit form': function(event) {
      event.preventDefault();
      var todoName = $('[name="todoName"]').val();
      Todos.insert({
        name: todoName,
        completed: false,
        createdAt: new Date(),
        listId: this._id
      });
      $('[name="todoName"]').val('');
    }
  });

  Template.toDoItem.events({
    'click .delete-todo': function(event) {
      event.preventDefault();
      if (window.confirm("Delete this task?")) {
       Todos.remove({ _id: this._id });    
      }
    },
    'keyup [name=toDoItem]': function(event){
      switch(event.which) {
        case 13: 
        case 27:
          $(event.target).blur();
        break;
        default:
          Todos.update({ _id: this._id }, {$set: { name: $(event.target).val()}});
      }
    },
    'change [type=checkbox]': function() {
      if (this.completed) {
        Todos.update({ _id: this._id }, {$set: { completed: false}});
      } else {
        Todos.update({ _id: this._id }, {$set: { completed: true}});
      }
    }
  });

  Template.addList.events({
    'submit form': function(event) {
      event.preventDefault();
      Lists.insert({
        name: $('[name=listName]').val()
      }, function(error, results) {
          Router.go('listPage', { _id: results });
      });
      $('[name=listName]').val('');
    }
  });

  Template.register.events({
    'submit form': function(event) {
        event.preventDefault();
        Accounts.createUser({
          email: $('[name=email]').val(),
          password: $('[name=password]').val()
        });
        Router.go('home');
    }
  });

  Template.navigation.events({
    'click .logout': function(event) {
      event.preventDefault;
      Meteor.logout();
      Router.go('login');
    }
  });

  Template.login.events({
    'submit form': function(event) {
      event.preventDefault;
      Meteor.loginWithPassword({
        email: $('[name=email]').val(),
        password: $('[name=password]').val()
      });
      Router.go('home');
    }
  });
}

if (Meteor.isServer) {

}
