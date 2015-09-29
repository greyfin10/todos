/******************** COLLECTIONS SECTION ********************/
Todos = new Meteor.Collection('todos');
Lists = new Meteor.Collection('lists');

/******************** ROUTES SECTION ********************/
Router.configure({ 
  layoutTemplate: 'main', 
  loadingTemplate: 'loading' }
);
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
  waitOn: function() {
    var currentList = this.params._id;
    return [Meteor.subscribe('todos', currentList)];
  }
});

if (Meteor.isClient) {

  /**************TEMPLATE LEVEL CONDITIONALS****************/
Template.lists.onCreated(function() {
  this.subscribe('lists');
})

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
      var listId = this._id;
      
      Meteor.call('createListItem', todoName, listId, function(error, results) {
        if (error) {
          console.log(error.reason);
        } else {
          $('[name="todoName"]').val('');
        }
      });      
    }
  });

  Template.toDoItem.events({
    'click .delete-todo': function(event) {
      event.preventDefault();
      var documentId = this._id;

      if (window.confirm("Delete this task?")) {
       Meteor.call('removeListItem', documentId);   
      }
    },
    'keyup [name=toDoItem]': function(event){
      switch(event.which) {
        case 13: 
        case 27:
          $(event.target).blur();
        break;
        default:
          var documentId = this._id;
          var todoItem = $(event.target).val();
          Meteor.call('updateListItem', documentId, todoItem);
      }
    },
    'change [type=checkbox]': function() {
      var itemCompleted = !this.completed;
      var listId = this._id;

      Meteor.call('changeItemStatus', listId, itemCompleted);
    }
  });

  Template.addList.events({
    'submit form': function(event) {
      event.preventDefault();

      var listName = $('[name=listName]').val();

      Meteor.call('createNewList',listName, function(error, results) {
        if (error) {
          console.log(error.reason);
        } else {
          Router.go('listPage', {_id: results});
          $('[name=listName]').val('');
        }
      });
      
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

  Meteor.methods({
    'createNewList': function(listName) {
      var currentUser = Meteor.userId();

      check(listName, String);

      if (listName=="") {
        listName = defaultName(currentUser);
      }

      var data = {
        name: listName,
        createdBy: currentUser
      };

      if (!currentUser) {
        throw new Meteor.Error("not-logged-in", "You're not logged in")
      }

      return Lists.insert(data);
    },
    'createListItem': function(itemName, listId) {
      var currentUser = Meteor.userId();

      check(itemName, String);

      var data = {
        name: itemName,
        completed: false,
        createdAt: new Date(),
        createdBy: currentUser,
        listId: listId
      };

      if (!currentUser) {
        throw new Meteor.Error("not-logged-in", "You're not logged in")
      }

      return Todos.insert(data);
    },
    'updateListItem': function(documentId, todoItem) {
      var currentUser = Meteor.userId();

      check(todoItem, String);

      if (!currentUser) {
        throw new Meteor.Error("not-logged-in", "You're not logged in");
      }

      var data = {
        _id: documentId,
        createdBy: currentUser
      };

      Todos.update(data, {$set: { name: todoItem }});
    },
    'changeItemStatus': function(documentId, status) {
      var currentUser = Meteor.userId();

      check(status, Boolean);

      var data = {
        _id: documentId,
        createdBy: currentUser
      };

      if (!currentUser) {
        throw new Meteor.Error("not-logged-in", "You're not logged in")
      }

      return Todos.update(data, {$set: { completed: status}});
    },
    'removeListItem': function(documentId) {
      var currentUser = Meteor.userId();

      if (!currentUser) {
        throw new Meteor.Error("not-logged-in", "You're not logged in");
      }

      check(documentId, String);

      var data = {
        _id: documentId,
        createdBy: currentUser
      };

      Todos.remove(data); 
    }
  });

  function defaultName(currentUser) {
    var nextLetter = 'A';
    var nextName = 'List' + nextLetter;

    while (Lists.findOne({name: nextName, createdBy: currentUser})) {
      nextLetter = String.fromCharCode(nextLetter.charCodeAt(0) + 1);
      nextName = 'List' + nextLetter;  
    }

    return nextName;
  }

}
