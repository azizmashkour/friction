// Copyright 2013-2018, University of Colorado Boulder

/**
 * The model for the Friction sim.
 *
 * @author Andrey Zelenkov (Mlearner)
 */
define( function( require ) {
  'use strict';

  // modules
  var friction = require( 'FRICTION/friction' );
  var FrictionSharedConstants = require( 'FRICTION/friction/FrictionSharedConstants' );
  var inherit = require( 'PHET_CORE/inherit' );
  var NumberProperty = require( 'AXON/NumberProperty' );
  var Property = require( 'AXON/Property' );
  var SimpleDragHandler = require( 'SCENERY/input/SimpleDragHandler' );
  var Vector2 = require( 'DOT/Vector2' );

  var ATOM_RADIUS = FrictionSharedConstants.ATOM_RADIUS; // radius of single atom
  var DISTANCE_X = 20; // x-distance between neighbors (atoms)
  var DISTANCE_Y = 20; // y-distance between neighbors (atoms)
  var DISTANCE_INITIAL = 25; // initial distance between top and bottom atoms
  var AMPLITUDE_MIN = 1; // min amplitude for an atom
  var AMPLITUDE_EVAPORATE = 7; // evaporation amplitude for an atom
  var AMPLITUDE_MAX = 12; // atom's max amplitude
  var BOOK_TOP_ATOMS_COLOR = FrictionSharedConstants.TOP_BOOK_ATOMS_COLOR; // color of top book
  var BOOK_BOTTOM_ATOMS_COLOR = FrictionSharedConstants.BOTTOM_BOOK_ATOMS_COLOR; // color of bottom
  var COOLING_RATE = 0.2; // proportion per second; adjust in order to change the cooling rate
  var HEATING_MULTIPLIER = 0.0075; // multiplied by distance moved while in contact to control heating rate
  var EVAPORATION_AMPLITUDE_REDUCTION = 0.01; // decrease in amplitude (a.k.a. temperature) when an atom evaporates
  var MAX_X_DISPLACEMENT = 600; // max allowed distance from center x
  var MIN_Y_POSITION = -70; // empirically determined such that top book can't be completely dragged out of frame

  // atoms of top book (contains 5 rows: 4 of them can evaporate, 1 - can not)
  var topAtomsStructure = [
    /**
     * First row:
     * contains 30 atoms that can not evaporate.
     */
    [
      { num: 30 }
    ],
    /**
     * Second row:
     * contains 29 atoms that can evaporate.
     * Have additional offset 0.5 of x-distance between atoms (to make the lattice of atoms).
     */
    [
      { offset: 0.5, num: 29, evaporate: true }
    ],
    /**
     * Third row:
     * contains 29 atoms that can evaporate.
     */
    [
      { num: 29, evaporate: true }
    ],
    /**
     * Fourth row:
     * contains 24 atoms, separated into 5 groups that can evaporate.
     * Have additional offset 0.5 of x-distance between atoms (to make the lattice of atoms).
     */
    [
      { offset: 0.5, num: 5, evaporate: true },
      { offset: 6.5, num: 8, evaporate: true },
      { offset: 15.5, num: 5, evaporate: true },
      { offset: 21.5, num: 5, evaporate: true },
      { offset: 27.5, num: 1, evaporate: true }
    ],
    /**
     * Fifth row:
     * contains 9 atoms, separated into 5 groups that can evaporate.
     */
    [
      { offset: 3, num: 2, evaporate: true },
      { offset: 8, num: 1, evaporate: true },
      { offset: 12, num: 2, evaporate: true },
      { offset: 17, num: 2, evaporate: true },
      { offset: 24, num: 2, evaporate: true }
    ]
  ];

  // atoms of bottom book (contains 3 rows that can not evaporate)
  var bottomAtomsStructure = [
    /**
     * First row:
     * contains 29 atoms that can not evaporate.
     */
    [
      { num: 29 }
    ],
    /**
     * Second row:
     * contains 28 atoms that can not evaporate.
     * Have additional offset 0.5 of x-distance between atoms (to make the lattice of atoms).
     */
    [
      { offset: 0.5, num: 28 }
    ],
    /**
     * Third row:
     * contains 29 atoms that can not evaporate.
     */
    [
      { num: 29 }
    ]
  ];

  /**
   * @param {number} width
   * @param {number} height
   * @param {Tandem} tandem
   * @constructor
   */
  function FrictionModel( width, height, tandem ) {
    var self = this;

    // @public - dimensions of the model's space
    this.width = width;

    // @public - dimensions of the model's space
    this.height = height;

    // @private - track how much to evaporate in step() to prevent a property loop
    this.scheduledEvaporationAmount = 0;

    // @public - create a suitable structure from the initial data for further work
    this.atoms = {
      radius: ATOM_RADIUS,
      distanceX: DISTANCE_X,
      distanceY: DISTANCE_Y,
      distance: DISTANCE_INITIAL,
      amplitude: {
        min: AMPLITUDE_MIN,
        max: AMPLITUDE_MAX
      },
      evaporationLimit: AMPLITUDE_EVAPORATE,
      top: {
        color: BOOK_TOP_ATOMS_COLOR,
        layers: topAtomsStructure
      },
      bottom: {
        color: BOOK_BOTTOM_ATOMS_COLOR,
        layers: bottomAtomsStructure
      }
    };

    // @public - array of all atoms which able to evaporate, need for resetting game
    this.toEvaporateSample = [];

    // @public - current set of atoms which may evaporate, but not yet evaporated (generally the lowest row in the top book)
    this.toEvaporate = [];

    // @public - atoms temperature = amplitude of oscillation
    this.temperatureProperty = new NumberProperty( this.atoms.amplitude.min, {
      tandem: tandem.createTandem( 'temperatureProperty' )
    } );

    // @public - position of top book, changes when dragging
    this.positionProperty = new Property( new Vector2( 0, 0 ) );

    // @public - distance between books
    this.distanceProperty = new Property( this.atoms.distance );

    // @private - additional offset, results from drag
    this.bottomOffsetProperty = new Property( 0 );

    // @public - top atoms number of rows to evaporate
    this.atomRowsToEvaporateProperty = new Property( 0 );

    // @private - are books in contact
    this.contactProperty = new Property( false );

    // @public - show hint icon
    this.hintProperty = new Property( true );

    // @public - update every step
    this.newStepProperty = new Property( false );

    // @public - drag and drop book coordinates conversion coefficient
    this.dndScale = 0.025;

    // check atom's contact
    this.distanceProperty.link( function( distance ) {
      self.contactProperty.set( Math.floor( distance ) <= 0 );
    } );

    // set distance between atoms and set the amplitude if they are in contact
    this.positionProperty.link( function( newPosition, oldPosition ) {
      self.distanceProperty.set( self.distanceProperty.get() - ( newPosition.minus( oldPosition || new Vector2( 0, 0 ) ) ).y );
      if ( self.contactProperty.get() ) {
        var dx = Math.abs( newPosition.x - oldPosition.x );
        self.temperatureProperty.set( Math.min( self.temperatureProperty.get() + dx * HEATING_MULTIPLIER, self.atoms.amplitude.max ) );
      }
    } );

    // evaporation check
    this.temperatureProperty.link( function( amplitude ) {
      if ( amplitude > self.atoms.evaporationLimit ) {
        self.evaporate();
      }
    } );
  }

  friction.register( 'FrictionModel', FrictionModel );

  return inherit( Object, FrictionModel, {

    /**
     * Move forward in time
     * @param {number} dt - in seconds
     * @public
     */
    step: function( dt ) {

      // Workaround for the case when user minimize window or switches to
      // another tab and then back, where big dt values can result.
      if ( dt > 0.5 ) {
        return;
      }
      this.newStepProperty.set( !this.newStepProperty.get() );

      // Cool the atoms.
      var temperature = this.temperatureProperty.get() - this.scheduledEvaporationAmount;
      temperature = Math.max( this.atoms.amplitude.min, temperature * ( 1 - dt * COOLING_RATE ) );
      this.temperatureProperty.set( temperature );

      this.scheduledEvaporationAmount = 0;
    },

    /**
     * Restores the initial conditions.
     * @public
     */
    reset: function() {
      this.temperatureProperty.reset();
      this.positionProperty.reset();
      this.distanceProperty.reset();
      this.bottomOffsetProperty.reset();
      this.atomRowsToEvaporateProperty.reset();
      this.contactProperty.reset();
      this.hintProperty.reset();
      this.newStepProperty.reset();
      this.init();
    },

    /**
     * TODO: this must be called from the end of the view construction for unknown reasonrs, or atoms don't fly off
     * @public
     */
    init: function() {
      var i;
      var j;
      for ( i = 0; i < this.toEvaporateSample.length; i++ ) {
        this.toEvaporate[ i ] = this.toEvaporateSample[ i ].slice( 0 );
      }

      for ( i = 0; i < this.toEvaporate.length; i++ ) {
        for ( j = 0; j < this.toEvaporate[ i ].length; j++ ) {
          this.toEvaporate[ i ][ j ].reset();
        }
      }

      this.atomRowsToEvaporateProperty.set( this.toEvaporate.length );

      // set min vertical position
      this.minYPos = MIN_Y_POSITION;
    },

    /**
     * Move the book, checking to make sure the new location is valid. If the book is going to move out of bounds,
     * prevent movement.
     *
     * @param {Object} v {x:{number}, y:{number}} - NOT a Vector2 (presumably to reduce memory footprint)
     * @public
     */
    move: function( v ) {
      this.hintProperty.set( false );

      // check bottom offset
      if ( this.bottomOffsetProperty.get() > 0 && v.y < 0 ) {
        this.bottomOffsetProperty.set( this.bottomOffsetProperty.get() + v.y );
        v.y = 0;
      }

      // Check if the motion vector would put the book in an invalid location and limit it if so.
      if ( v.y > this.distanceProperty.get() ) {
        this.bottomOffsetProperty.set( this.bottomOffsetProperty.get() + v.y - this.distanceProperty.get() );
        v.y = this.distanceProperty.get();
      }
      else if ( this.positionProperty.get().y + v.y < this.minYPos ) {
        v.y = this.minYPos - this.positionProperty.get().y; // Limit book from going out of magnifier window.
      }
      if ( this.positionProperty.get().x + v.x > MAX_X_DISPLACEMENT ) {
        v.x = MAX_X_DISPLACEMENT - this.positionProperty.get().x;
      }
      else if ( this.positionProperty.get().x + v.x < -MAX_X_DISPLACEMENT ) {
        v.x = -MAX_X_DISPLACEMENT - this.positionProperty.get().x;
      }

      // set the new position
      this.positionProperty.set( this.positionProperty.get().plus( v ) );
    },

    /**
     * // TODO: this seems like the wrong place for this code, also; why is it creating so many drag handlers?
     * @param {Node} node
     * @public
     */
    addDragInputListener: function( node, tandem ) {
      var self = this;
      node.cursor = 'pointer';
      node.addInputListener( new SimpleDragHandler( {
        translate: function( e ) {
          self.move( { x: e.delta.x, y: e.delta.y } );
        },
        end: function() {
          self.bottomOffsetProperty.set( 0 );
        },
        tandem: tandem
      } ) );
    },

    /**
     * TODO: document me
     * @private
     */
    evaporate: function() {
      if ( this.toEvaporate[ this.toEvaporate.length - 1 ] && !this.toEvaporate[ this.toEvaporate.length - 1 ].length ) {
        // move to the next row of atoms to evaporate
        this.toEvaporate.pop();
        this.distanceProperty.set( this.distanceProperty.get() + this.atoms.distanceY );
        this.atomRowsToEvaporateProperty.set( this.toEvaporate.length );
      }

      if ( this.toEvaporate[ this.toEvaporate.length - 1 ] ) {
        // choose a random atom from the current row and evaporate it
        var currentEvaporationRow = this.toEvaporate[ this.toEvaporate.length - 1 ];
        var atom = currentEvaporationRow.splice( Math.floor( Math.random() * currentEvaporationRow.length ), 1 )[ 0 ];
        if ( atom ) {
          atom.evaporate();
          this.scheduledEvaporationAmount = this.scheduledEvaporationAmount + EVAPORATION_AMPLITUDE_REDUCTION; // cooling due to evaporation
        }
      }
    }
  }, { // statics
    // a11y - needed to get bounds for the keyboard drag handler, see https://github.com/phetsims/friction/issues/46
    MAX_X_DISPLACEMENT: MAX_X_DISPLACEMENT,
    MIN_Y_POSITION: MIN_Y_POSITION
  } );
} );