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

      var currentList = this._id; 
      var currentUser = Meteor.userId();

      return Todos.find({listId: currentList, createdBy: currentUser }, {sort: {creatdAt: -1}});
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

    var currentUser = Meteor.userId();

      return Lists.find({createdBy: currentUser}, {sort: {name: 1}});
    }
  });

  /********************EVENTS SECTION********************/
  Template.addTodo.events({
    'submit form': function(event) {
      event.preventDefault();
      
      var todoName = $('[name="todoName"]').val();
      var currentUser = Meteor.userId();

      Todos.insert({
        name: todoName,
        completed: false,
        createdAt: new Date(),
        createdBy: currentUser,
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

      var listName = $('[name=listName]').val();
      var currentUser = Meteor.userId();

      Lists.insert({
        name: listName,
        createdBy: currentUser
      }, function(error, results) {
          Router.go('listPage', { _id: results });
      });

      $('[name=listName]').val('');
    }
  });

  Template.register.events({
    'submit form': function(event) {
      event.preventDefault();

      var username = $('[name=email]').val();
      var password = $('[name=password]').val();

      Accounts.createUser({
        email: username,
        password: password},
        function(error) {
          if (error) {
            console.log(error.reason);
          } else {
            Router.go('home');
          }
      });
    }
  });

  Template.navigation.events({
    'click .logout': function(event) {
      event.preventDefault();
      Meteor.logout();
      Router.go('login');
    }
  });

  Template.login.events({
    'submit form': function(event) {
      event.preventDefault();

      var username = $('[name=email]').val();
      var password = $('[name=password]').val();

      Meteor.loginWithPassword(username, password, function(error) {
        if (error) {
          console.log(error.reason);
        } else {
          Router.go("home");
        }
      });
    }
  });  


}

if (Meteor.isServer) {

}
