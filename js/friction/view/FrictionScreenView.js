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
  const BookRubSoundGenerator = require( 'FRICTION/friction/view/BookRubSoundGenerator' );
  const Bounds2 = require( 'DOT/Bounds2' );
  const BreakAwayDescriber = require( 'FRICTION/friction/view/describers/BreakAwayDescriber' );
  const ControlAreaNode = require( 'SCENERY_PHET/accessibility/nodes/ControlAreaNode' );
  const CoolingSoundGenerator = require( 'FRICTION/friction/view/CoolingSoundGenerator' );
  const friction = require( 'FRICTION/friction' );
  const FrictionConstants = require( 'FRICTION/friction/FrictionConstants' );
  const FrictionModel = require( 'FRICTION/friction/model/FrictionModel' );
  const FrictionScreenSummaryNode = require( 'FRICTION/friction/view/FrictionScreenSummaryNode' );
  const inherit = require( 'PHET_CORE/inherit' );
  const MagnifierNode = require( 'FRICTION/friction/view/magnifier/MagnifierNode' );
  const MoleculeMotionSoundGenerator = require( 'FRICTION/friction/view/MoleculeMotionSoundGenerator' );
  const PlayAreaNode = require( 'SCENERY_PHET/accessibility/nodes/PlayAreaNode' );
  const ResetAllButton = require( 'SCENERY_PHET/buttons/ResetAllButton' );
  const ResetAllSoundGenerator = require( 'TAMBO/sound-generators/ResetAllSoundGenerator' );
  const ScreenView = require( 'JOIST/ScreenView' );
  const SoundClip = require( 'TAMBO/sound-generators/SoundClip' );
  const SoundLevelEnum = require( 'TAMBO/SoundLevelEnum' );
  const soundManager = require( 'TAMBO/soundManager' );
  const TemperatureDecreasingDescriber = require( 'FRICTION/friction/view/describers/TemperatureDecreasingDescriber' );
  const TemperatureIncreasingDescriber = require( 'FRICTION/friction/view/describers/TemperatureIncreasingDescriber' );
  const ThermometerNode = require( 'SCENERY_PHET/ThermometerNode' );

  // strings
  const chemistryString = require( 'string!FRICTION/chemistry' );
  const physicsString = require( 'string!FRICTION/physics' );

  // sounds
  const bookContactSound = require( 'sound!FRICTION/contact-lower.mp3' );
  const moleculeBreakOffSound = require( 'sound!FRICTION/break-off-autosinfonie-spatialized.mp3' );

  // constants
  const THERMOMETER_FLUID_MAIN_COLOR = 'rgb(237,28,36)';
  const THERMOMETER_FLUID_HIGHLIGHT_COLOR = 'rgb(240,150,150)';
  const THERMOMETER_FLUID_RIGHT_SIDE_COLOR = 'rgb(237,28,36)';
  const THERMOMETER_BACKGROUND_FILL_COLOR = 'white';
  const THERMOMETER_MIN_TEMP = FrictionModel.THERMOMETER_MIN_TEMP;
  const THERMOMETER_MAX_TEMP = FrictionModel.THERMOMETER_MAX_TEMP;

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
    const frictionSummaryNode = new FrictionScreenSummaryNode( model, THERMOMETER_MIN_TEMP, THERMOMETER_MAX_TEMP );
    this.screenSummaryNode.addChild( frictionSummaryNode );

    // add physics book
    this.addChild( new BookNode( model, physicsString, {
      x: 50,
      y: 225,
      tandem: tandem.createTandem( 'physicsBookNode' )
    } ) );

    // add chemistry book
    const chemistryBookNode = new BookNode( model, chemistryString, {
      x: 65,
      y: 209,
      color: FrictionConstants.TOP_BOOK_COLOR_MACRO,
      drag: true,
      tandem: tandem.createTandem( 'chemistryBookNode' )
    } );
    this.addChild( chemistryBookNode );

    // create and hook up the sound that will be produced when the books come into contact with one another
    const bookContactSoundClip = new SoundClip( bookContactSound, { initialOutputLevel: 0.06 } );
    soundManager.addSoundGenerator( bookContactSoundClip );
    model.contactProperty.link( contact => {
      if ( contact ) {
        bookContactSoundClip.play();
      }
    } );

    // @private {BookRubSoundGenerator} - sound generator for when the books rub together
    this.bookRubSoundGenerator = new BookRubSoundGenerator( model.topBookPositionProperty, model.contactProperty, {
      maxOutputLevel: 0.5
    } );
    soundManager.addSoundGenerator( this.bookRubSoundGenerator );

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

    const playAreaNode = new PlayAreaNode();
    this.addChild( playAreaNode );

    // a11y
    playAreaNode.accessibleOrder = [ chemistryBookNode, this.magnifierNode ];

    // add reset button
    const resetAllButton = new ResetAllButton( {
      listener: function() {
        model.reset();
        self.reset();
      },
      radius: 22,
      x: model.width * 0.94,
      y: model.height * 0.9,
      touchAreaDilation: 5,
      tandem: tandem.createTandem( 'resetAllButton' )
    } );
    this.addChild( resetAllButton );

    // add sound generator for reset
    soundManager.addSoundGenerator( new ResetAllSoundGenerator( model.resetInProgressProperty, {
      initialOutputLevel: 0.7
    } ) );

    // create and register the sound that will be played to indicate changes to the rate of molecule motion
    soundManager.addSoundGenerator( new MoleculeMotionSoundGenerator( model.amplitudeProperty, {
      maxOutputLevel: 0.175
    } ) );

    // create and hook up the sound that is played when molecules break off from the top book
    const moleculeBreakOffSoundClip = new SoundClip( moleculeBreakOffSound, { initialOutputLevel: 0.05 } );
    soundManager.addSoundGenerator( moleculeBreakOffSoundClip );
    model.evaporationEmitter.addListener( () => {

      // don't play for every evaporated molecule or it's too noisy
      if ( model.numberOfAtomsEvaporated % 4 === 0 ) {

        // choose a playback rate
        moleculeBreakOffSoundClip.playbackRate = FrictionConstants.GET_RANDOM_PENTATONIC_PLAYBACK_RATE();

        // play the sound
        moleculeBreakOffSoundClip.play();
      }
    } );

    // @private {CoolingSoundGenerator} - sound generator that produces the "cooling off" sound
    this.coolingSoundGenerator = new CoolingSoundGenerator( model.amplitudeProperty, {
      maxOutputLevel: 0.75
    } );
    soundManager.addSoundGenerator( this.coolingSoundGenerator, {
      sonificationLevel: SoundLevelEnum.ENHANCED
    } );

    // add a node that creates a "play area" accessible section in the PDOM
    const controlAreaNode = new ControlAreaNode();
    this.addChild( controlAreaNode );
    controlAreaNode.accessibleOrder = [ resetAllButton ];

    // @private
    this.resetFrictionScreenView = function() {

      // a11y - among other things, this will reset the grab button cuing.
      this.magnifierNode.reset();
      chemistryBookNode.reset();

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
      this.bookRubSoundGenerator.step( dt );
      this.coolingSoundGenerator.step( dt );
    },

    /**
     * Reset the view
     * @private
     */
    reset() {
      this.resetFrictionScreenView();
    }
  } );
} );
