// How does Tracker work?

// - it builds a graph of functional dependancies

// How?

// - Tracker.autorun keeps track that the current function is running. Then 
//   reactive sources can register the currently running function as a dependancy.
//   Its actually pretty simple.

// Why don't I just show you?

// Track keeps track of the current function that is running and when you call Track.autorun, 
// it just creates a computation object.
Track = {
  comp: null,
  autorun: function(func) {
    new Comp(func)
  }
}

// A computation represents a reactive function.
var count = 0
Comp = function(func) {
  this.id = count
  count += 1
  this.func = func
  this.run()
}

// When you run a reactive function, it sets the current computation to itself
// while its running. This way, any reactive sources can reference this computation.
Comp.prototype.run = function() {
  var tmp = Track.comp
  Track.comp = this
  this.func()
  tmp = Track.comp
}

// Depend keeps track of what computations depend on this reactive source.
Depend = function() {
  this.deps = {}
}

// When we call get() on a reactive source, then the current computation must
// *depend* on this value.
Depend.prototype.depend = function() {
  if (Track.comp) {
    this.deps[Track.comp.id] = Track.comp
  }
}

// When we call set() on a reactive source, then we want to *rerun* all the 
// computations that depend on this value.
Depend.prototype.rerun = function() {
  for (var id in this.deps) {
    this.deps[id].run()
  }
}

// Var is a reactive source. It basically just has some setters and getters.
Var = function(value) {
  this.value = value
  this.dep = new Depend()
}

Var.prototype.get = function() {
  this.dep.depend()
  return this.value
}

Var.prototype.set = function(x) {
  this.value = x
  this.dep.rerun()
}


// How do we use it?

// - lets create an app that displays a + b = c

// Here's a simple procedural way.

// Wait for the DOM to load.
// Meteor.startup(function() {
//   // Create some JQuery event listeners to set the Vars
//   var update = function() {
//     A = Number($('#a').val())
//     B = Number($('#b').val())
//     if (_.isNaN(A) || _.isNaN(B)) {
//       $('#error').html('Please input a valid number.')
//     } else {
//       $('#error').html('')
//       $('#c').html(A+B)
//     }
//   }
//   $('#a').keyup(update)
//   $('#b').keyup(update)
// })

// Now here's the declarative way.
a = new Var(0)
b = new Var(0)
// a + b = c
c = new Var(0)
error = new Var('')

// Wait for the DOM to load.
Meteor.startup(function() {

  // Binding some JQuery event listeners to set the Vars
  $('#a').keyup(function() {
    a.set(Number($('#a').val()))
  })

  $('#b').keyup(function() {
    b.set(Number($('#b').val()))
  })

  // Logic: C  = A + B or display the error
  Track.autorun(function() {
    A = a.get()
    B = b.get()
    if (_.isNaN(A) || _.isNaN(B)) {
      error.set('Please input a valid Number')
    } else {
      c.set(A + B)
      error.set('')
    }
  })

  // Rendering:
  Track.autorun(function() {
    $('#c').html(c.get())
    $('#error').html(error.get())
  })

})

// Why is declarative better than procedual?

// - separation of logic from rendering.
// - easier to understand what is going on.
// - think like an excel spreadsheet -- declarative!