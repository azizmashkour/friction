// Copyright 2013-2017, University of Colorado Boulder

/**
 * main ScreenView container.
 *
 * @author Andrey Zelenkov (Mlearner)
 */
define( function( require ) {
  'use strict';

  // modules
  var BookNode = require( 'FRICTION/friction/view/book/BookNode' );
  var Bounds2 = require( 'DOT/Bounds2' );
  var friction = require( 'FRICTION/friction' );
  var FrictionSharedConstants = require( 'FRICTION/friction/FrictionSharedConstants' );
  var inherit = require( 'PHET_CORE/inherit' );
  var MagnifierNode = require( 'FRICTION/friction/view/magnifier/MagnifierNode' );
  var ResetAllButton = require( 'SCENERY_PHET/buttons/ResetAllButton' );
  var ScreenView = require( 'JOIST/ScreenView' );
  var ThermometerNode = require( 'SCENERY_PHET/ThermometerNode' );

  // strings
  var chemistryString = require( 'string!FRICTION/chemistry' );
  var physicsString = require( 'string!FRICTION/physics' );

  // constants
  var THERMOMETER_FLUID_MAIN_COLOR = 'rgb(237,28,36)';
  var THERMOMETER_FLUID_HIGHLIGHT_COLOR = 'rgb(240,150,150)';
  var THERMOMETER_FLUID_RIGHT_SIDE_COLOR = 'rgb(237,28,36)';
  var THERMOMETER_BACKGROUND_FILL_COLOR = 'white';

  /**
   * @param {FrictionModel} model
   * @constructor
   */
  function FrictionScreenView( model ) {
    ScreenView.call( this, { layoutBounds: new Bounds2( 0, 0, model.width, model.height ) } );

    // add physics book
    this.addChild( new BookNode( model, 50, 225, physicsString ) );

    // @private (for a11y) - add chemistry book
    this.draggableBook = new BookNode( model, 65, 209, chemistryString, {
      color: FrictionSharedConstants.TOP_BOOK_COLOR_MACRO,
      drag: true
    } );
    this.addChild( this.draggableBook );

    // add magnifier
    this.addChild( this.magnifier = new MagnifierNode( model, 40, 25, 195, 425, chemistryString, { layerSplit: true } ) );

    // add thermometer
    this.addChild( new ThermometerNode( model.atoms.amplitude.min - 1.05, model.atoms.evaporationLimit * 1.1, model.amplitudeProperty, {
      x: 690,
      y: 250,
      tubeHeight: 160,
      tickSpacing: 9,
      lineWidth: 1,
      tubeWidth: 12,
      bulbDiameter: 24,
      majorTickLength: 4,
      minorTickLength: 4,
      fluidMainColor: THERMOMETER_FLUID_MAIN_COLOR,
      fluidHighlightColor: THERMOMETER_FLUID_HIGHLIGHT_COLOR,
      fluidRightSideColor: THERMOMETER_FLUID_RIGHT_SIDE_COLOR,
      backgroundFill: THERMOMETER_BACKGROUND_FILL_COLOR
    } ) );

    // add reset button
    this.addChild( new ResetAllButton( {
      listener: function() { model.reset(); },
      radius: 22,
      x: model.width * 0.94,
      y: model.height * 0.9
    } ) );

    model.init(); // TODO: does this need to be called here?  If so, why?
  }

  friction.register( 'FrictionScreenView', FrictionScreenView );

  return inherit( ScreenView, FrictionScreenView, {
    step: function( timeElapsed ) {
      this.magnifier.step( timeElapsed );
    }
  } );
} );
