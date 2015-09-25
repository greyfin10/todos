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
    var currentList = this.params._id;
    var currentUser = Meteor.userId();

    return Lists.findOne({ _id: currentList, createdBy: currentUser });
  }, onRun: function() {
    //console.log("You triggered 'onRun' for 'listPage'");
    this.next();
  }, onBeforeAction: function() {
    //console.log("You triggered onBeforeAction; for 'listPage' route.");
    
    var currentUser = Meteor.userId();
    
    if (currentUser) {
      this.next();
    } else {
      this.render("login");
    }
  }, 
  subscriptions: function() {
    var currentList = this.params._id;
    return [Meteor.subscribe('lists'), Meteor.subscribe('todos', currentList)];
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

  Template.main.helpers({
    'loggedUser': function() {
      var Email;

      //Email = Meteor.user().emails[0].address;

      return Email;
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
    }
  });  

  /********************VALIDATION SECTION********************/

  $.validator.setDefaults({
    rules: {
      password: {
          required: true,
          minlength: 6
        },
        email: {
          required: true,
          email: true
        }
    },
    messages: {
      email: {
        required: "You MUST enter an email address!",
        email: "You've entered an invalid email."
      },
      password: {
        required: "You MUST enter a password!",
        minlength: "Your password must be at least {0} characters."
      }
    }
  });

  Template.login.onCreated(function() {
    //console.log("The 'login' template was just created.");
  });

  Template.login.onRendered(function() {
    var validator = $('.login').validate({
      submitHandler: function(event) {
        var username = $('[name=email]').val();
        var password = $('[name=password]').val();

        Meteor.loginWithPassword(username, password, function(error) {
          if (error) {
            if (error.reason == "User not found") {
              validator.showErrors({
                email: "That email doesn't belong to a registered user."
              });
            }

            if (error.reason == "Incorrect password") {
              validator.showErrors({
                password: "You entered an incorrect password."
              });
            }
          } else {
            var currentRoute = Router.current().route.getName();
            if (currentRoute == "login") {
              Router.go("home");
            }
          }
        });
      }
    });
  });

  Template.login.onDestroyed(function() {
    //console.log("The 'login' template was just destroyed.");
  });

  Template.register.onRendered(function() {
    var validator = $('.register').validate({
      submitHandler: function(event) {
        var email = $('[name=email]').val();
        var password = $('[name=password]').val();

        Accounts.createUser({
          email: email,
          password: password
        }, function(error) {
            if (error) {
              if (error.reason == "Email already exists.") {
                validator.showErrors({
                  email: "That email already belongs to a registered user."
                });
              }
            } else {
              Router.go('home');
            }
        });
      }
    });
  });
}


if (Meteor.isServer) {
  Meteor.publish('lists', function() {
    var currentUser = this.userId;

    return Lists.find({createdBy: currentUser });
  });

  Meteor.publish('todos', function(currentList) {
    var currentUser = this.userId;

    return Todos.find({createdBy: currentUser, listId: currentList});
  });
}
