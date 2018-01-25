// Copyright 2013-2018, University of Colorado Boulder

/**
 * view for single atom
 *
 * @author Andrey Zelenkov (Mlearner)
 */
define( function( require ) {
  'use strict';

  // modules
  var Circle = require( 'SCENERY/nodes/Circle' );
  var friction = require( 'FRICTION/friction' );
  var FrictionSharedConstants = require( 'FRICTION/friction/FrictionSharedConstants' );
  var Image = require( 'SCENERY/nodes/Image' );
  var inherit = require( 'PHET_CORE/inherit' );
  var Node = require( 'SCENERY/nodes/Node' );
  var Vector2 = require( 'DOT/Vector2' );

  /**
   * @param model
   * @param {Object} [options]
   * @constructor
   */
  function AtomNode( model, options ) {
    var self = this;
    var radius = model.atoms.radius;

    this.isTopAtom = options.color === FrictionSharedConstants.TOP_BOOK_ATOMS_COLOR; // flag records whether we are on the top book
    this.isEvaporated = false;
    this.currentX = 0;
    this.currentY = 0;
    this.x0 = options.x;
    this.y0 = options.y;
    this.model = model;
    this.options = options;
    Node.call( this, { x: this.x0, y: this.y0 } );

    // function for creating or obtaining atom graphic for a given color
    if ( !AtomNode.atomGraphics[ options.color ] ) {
      var scale = AtomNode.imageScale; // Scale up before rasterization so it won't be too pixellated/fuzzy, value empirically determined.
      var container = new Node( { scale: 1 / scale } );
      var atomNode = new Circle( radius, { fill: options.color, stroke: 'black', lineWidth: 1, scale: scale } );
      atomNode.addChild( new Circle( radius * 0.3, { fill: 'white', x: radius * 0.3, y: -radius * 0.3 } ) );
      atomNode.toImage( function( img, x, y ) {
        // add our actual HTMLImageElement to atomImages
        AtomNode.atomImages[ self.isTopAtom ] = img;
        AtomNode.atomOffset = new Vector2( -x, -y );

        // add a node with that image to our container (part of atomGraphics)
        container.addChild( new Node( {
          children: [
            new Image( img, { x: -x, y: -y } )
          ]
        } ) );
      } );
      AtomNode.atomGraphics[ options.color ] = container;
    }
    this.addChild( AtomNode.atomGraphics[ options.color ] );

    // move the atom as the top book moves if it is part of that book
    var motionVector = new Vector2(); // Optimization to minimize garbage collection.
    model.positionProperty.lazyLink( function( newPosition, oldPosition ) {
      if ( self.isTopAtom && !self.isEvaporated ) {
        motionVector.set( newPosition );
        motionVector.subtract( oldPosition );
        self.x0 = self.x0 + motionVector.x;
        self.y0 = self.y0 + motionVector.y;
      }
    } );

    // update atom's position based on vibration and center position
    model.newStepProperty.link( function() {
      self.currentX = self.x0 + model.amplitudeProperty.get() * ( Math.random() - 0.5 );
      self.currentY = self.y0 + model.amplitudeProperty.get() * ( Math.random() - 0.5 );
    } );
  }

  // export information needed to directly render the images
  AtomNode.imageScale = 3;
  AtomNode.atomGraphics = {};
  AtomNode.atomImages = {};
  AtomNode.atomOffset = null; // NOTE: this is OK for now because the atoms are the same size, and the toImage'd images should have the exact same offsets

  friction.register( 'AtomNode', AtomNode );

  return inherit( Node, AtomNode, {
    evaporate: function() {
      var self = this;
      var steps = 250; // steps until atom has completed evaporation movement
      var dx;
      var dy;

      this.isEvaporated = true;

      var evaporationDestinationX = this.x0 + 4 * this.model.width * ( Math.round( Math.random() ) - 0.5 );
      dx = ( evaporationDestinationX - this.x0 ) / steps;
      var evaporationDestinationY = this.y0 + Math.random() * 1.5 * this.getYrange();
      dy = ( evaporationDestinationY - this.y0 ) / steps;

      // create and attach the evaporation motion handler
      this.handler = function() {
        self.x0 += dx;
        self.y0 -= dy;
        if ( self.x0 > 4 * self.model.width ) {
          self.model.newStepProperty.unlink( self.handler );
          self.setVisible( false );
        }
      };
      this.model.newStepProperty.link( self.handler );
    },
    getYrange: function() {
      var model = this.model;
      return model.distanceProperty.get() + model.atoms.distanceY * model.toEvaporate.length;
    },
    reset: function() {
      this.x0 = this.options.x;
      this.y0 = this.options.y;

      // handler may have been unlinked by itself (see above), so check that we're still registered
      if ( this.model.newStepProperty.hasListener( this.handler ) ) {
        this.model.newStepProperty.unlink( this.handler );
      }
      this.setVisible( true );
      this.isEvaporated = false;
    }
  } );
} )
;