// Copyright 2013-2018, University of Colorado Boulder

/**
 * Friction's ScreenView
 *
 * @author Andrey Zelenkov (Mlearner)
 * @author John Blanco (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  const BookMovementDescriber = require( 'FRICTION/friction/view/describers/BookMovementDescriber' );
  const BookNode = require( 'FRICTION/friction/view/book/BookNode' );
  const Bounds2 = require( 'DOT/Bounds2' );
  const BreakAwayDescriber = require( 'FRICTION/friction/view/describers/BreakAwayDescriber' );
  const ControlAreaNode = require( 'SCENERY_PHET/accessibility/nodes/ControlAreaNode' );
  const CueArrow = require( 'FRICTION/friction/view/CueArrow' );
  const friction = require( 'FRICTION/friction' );
  const FrictionConstants = require( 'FRICTION/friction/FrictionConstants' );
  const FrictionModel = require( 'FRICTION/friction/model/FrictionModel' );
  const FrictionScreenSummaryNode = require( 'FRICTION/friction/view/FrictionScreenSummaryNode' );
  const inherit = require( 'PHET_CORE/inherit' );
  const MagnifierNode = require( 'FRICTION/friction/view/magnifier/MagnifierNode' );
  const Node = require( 'SCENERY/nodes/Node' );
  const PlayAreaNode = require( 'SCENERY_PHET/accessibility/nodes/PlayAreaNode' );
  const ResetAllButton = require( 'SCENERY_PHET/buttons/ResetAllButton' );
  const ScreenView = require( 'JOIST/ScreenView' );
  const TemperatureDecreasingDescriber = require( 'FRICTION/friction/view/describers/TemperatureDecreasingDescriber' );
  const TemperatureIncreasingDescriber = require( 'FRICTION/friction/view/describers/TemperatureIncreasingDescriber' );
  const ThermometerNode = require( 'SCENERY_PHET/ThermometerNode' );

  // strings
  const chemistryString = require( 'string!FRICTION/chemistry' );
  const physicsString = require( 'string!FRICTION/physics' );


  // constants
  const THERMOMETER_FLUID_MAIN_COLOR = 'rgb(237,28,36)';
  const THERMOMETER_FLUID_HIGHLIGHT_COLOR = 'rgb(240,150,150)';
  const THERMOMETER_FLUID_RIGHT_SIDE_COLOR = 'rgb(237,28,36)';
  const THERMOMETER_BACKGROUND_FILL_COLOR = 'white';
  const THERMOMETER_MIN_TEMP = FrictionModel.MAGNIFIED_ATOMS_INFO.vibrationAmplitude.min - 1.05; // about 0
  const THERMOMETER_MAX_TEMP = FrictionModel.MAGNIFIED_ATOMS_INFO.evaporationLimit * 1.1; // 7.7???

  /**
   * @param {FrictionModel} model
   * @param {Tandem} tandem
   * @constructor
   */
  function FrictionScreenView( model, tandem ) {
    const self = this;
    ScreenView.call( this, {
      layoutBounds: new Bounds2( 0, 0, model.width, model.height ),
      addScreenSummaryNode: true // opt into the generic screen overview strategy provided by ScreenView.js see https://github.com/phetsims/joist/issues/509
    } );

    // @private
    this.model = model;

    // a11y initialize the describers for auditory descriptions and alerts.
    TemperatureIncreasingDescriber.initialize( model );
    TemperatureDecreasingDescriber.initialize( model );
    BreakAwayDescriber.initialize( model );
    BookMovementDescriber.initialize( model );

    // a11y
    let frictionSummaryNode = new FrictionScreenSummaryNode( model, THERMOMETER_MIN_TEMP, THERMOMETER_MAX_TEMP );
    this.screenSummaryNode.addChild( frictionSummaryNode );


    // add physics book
    this.addChild( new BookNode( model, physicsString, {
      x: 50,
      y: 225,
      tandem: tandem.createTandem( 'physicsBookNode' )
    } ) );

    // add chemistry book
    let chemistryBookNode = new BookNode( model, chemistryString, {
      x: 65,
      y: 209,
      color: FrictionConstants.TOP_BOOK_COLOR_MACRO,
      drag: true,
      tandem: tandem.createTandem( 'chemistryBookNode' )
    } );


    // cueing arrows for the book
    const bookCueArrow1 = new CueArrow( { rotation: Math.PI } );
    const bookCueArrow2 = new CueArrow( { x: chemistryBookNode.width } );
    const bookCueArrow3 = new CueArrow( {
      rotation: Math.PI / 2,
      x: chemistryBookNode.width / 2,
      y: chemistryBookNode.height / 2 + 5 // empirical
    } );
    const arrows = new Node( {
      visible: false, children: [ bookCueArrow1, bookCueArrow2, bookCueArrow3 ]
    } );

    chemistryBookNode.addChild( arrows );

    this.addChild( chemistryBookNode );

    // @private - add magnifier
    this.magnifierNode = new MagnifierNode( model, 195, 425, chemistryString, tandem.createTandem( 'magnifierNode' ), {
      x: 40,
      y: 25,
      layerSplit: true
    } );
    this.addChild( this.magnifierNode );

    // add thermometer
    this.addChild( new ThermometerNode(
      THERMOMETER_MIN_TEMP,
      THERMOMETER_MAX_TEMP,
      model.amplitudeProperty,
      {
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
      }
    ) );

    let playAreaNode = new PlayAreaNode();
    this.addChild( playAreaNode );

    // a11y
    playAreaNode.accessibleOrder = [ chemistryBookNode, this.magnifierNode ];

    // add reset button
    let resetAllButton = new ResetAllButton( {
      listener: function() {
        model.reset();
        self.reset();
      },
      radius: 22,
      x: model.width * 0.94,
      y: model.height * 0.9,
      touchAreaDilation: 12,
      tandem: tandem.createTandem( 'resetAllButton' )
    } );
    this.addChild( resetAllButton );

    let controlAreaNode = new ControlAreaNode();
    this.addChild( controlAreaNode );
    controlAreaNode.accessibleOrder = [ resetAllButton ];

    // @private
    this.resetFrictionScreenView = function() {

      // a11y - among other things, this will reset the grab button cueing.
      this.magnifierNode.reset();

      // TODO: reset this soon
      // grabButtonForBook.reset();

      // a11y, reset PDOM and reset alerting types
      TemperatureDecreasingDescriber.getDescriber().reset();
      TemperatureIncreasingDescriber.getDescriber().reset();
      BreakAwayDescriber.getDescriber().reset();
      BookMovementDescriber.getDescriber().reset();
      frictionSummaryNode.updateSummaryString();
    };
  }

  friction.register( 'FrictionScreenView', FrictionScreenView );

  return inherit( ScreenView, FrictionScreenView, {

    /**
     * move forward in time
     * @param {number} dt - delta time, in seconds
     * @public
     */
    step( dt ) {
      this.magnifierNode.step( dt );
    },

    /**
     * Reset the view
     * @private
     */
    reset() {
      this.resetFrictionScreenView();
    }
  }, {

    // @public - exported for other view code
    THERMOMETER_MAX_TEMP: THERMOMETER_MAX_TEMP
  } );
} );
