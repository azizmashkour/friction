/**
 * Copyright 2002-2013, University of Colorado
 * view for single atom
 *
 * @author Andrey Zelenkov (Mlearner)
 */


define( function( require ) {
  'use strict';
  var Node = require( 'SCENERY/nodes/Node' );
  var inherit = require( 'PHET_CORE/inherit' );

  var Circle = require( 'SCENERY/nodes/Circle' );

  function Atom( model, options ) {
    var self = this, radius = model.atoms.radius;
    this.x0 = options.x;
    this.y0 = options.y;
    this.model = model;
    this.options = options;
    this.gradients = {};
    Node.call( this, {x: this.x0, y: this.y0} );

    // add view
    this.view = new Node( {children: [new Circle( radius, {
      fill: options.color,
      stroke: 'black',
      lineWidth: 1
    } ), new Circle( radius * 0.3, {fill: 'white', x: radius * 0.3, y: -radius * 0.3} )]} );

    this.addChild( this.view );

    model.newStepProperty.link( function() {
      self.x = self.x0 + model.amplitude * (Math.random() - 0.5);
      self.y = self.y0 + model.amplitude * (Math.random() - 0.5);
    } );
  }

  inherit( Node, Atom );

  Atom.prototype.evaporate = function() {
    var self = this, steps = 100, dx, dy;

    this.handler = function() {
      self.x0 += dx;
      self.y0 -= dy;
      if ( self.x0 > 10 * self.model.width ) {
        self.model.newStepProperty.unlink( self.handler );
        self.setVisible( false );
      }
    };

    this.x1 = this.x0 + 4 * this.model.width * (Math.round( Math.random() ) - 0.5);
    dx = (this.x1 - this.x0) / steps;
    this.y1 = this.y0 + Math.random() * 1.5 * this.getYrange();
    dy = (this.y1 - this.y0) / 100;
    this.model.newStepProperty.link( self.handler );
  };

  Atom.prototype.reset = function() {
    this.x0 = this.options.x;
    this.y0 = this.options.y;
    this.model.newStepProperty.unlink( this.handler );
    this.setVisible( true );
  };

  Atom.prototype.getYrange = function() {
    var model = this.model;
    return model.distance + model.atoms.dy * model.toEvaporate.length;
  };

  return Atom;
} );