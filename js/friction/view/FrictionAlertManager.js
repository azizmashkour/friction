// Copyright 2018, University of Colorado Boulder

/**
 * Manager for the alerts that are dynamically emitted in the simulation.
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  const friction = require( 'FRICTION/friction' );
  const FrictionA11yStrings = require( 'FRICTION/friction/FrictionA11yStrings' );
  const FrictionModel = require( 'FRICTION/friction/model/FrictionModel' );
  const Range = require( 'DOT/Range' );
  const StringUtils = require( 'PHETCOMMON/util/StringUtils' );
  const TemperatureZoneEnum = require( 'FRICTION/friction/model/TemperatureZoneEnum' );
  const utteranceQueue = require( 'SCENERY_PHET/accessibility/utteranceQueue' );
  const Utterance = require( 'SCENERY_PHET/accessibility/Utterance' );

  // a11y strings
  const frictionIncreasingAtomsJigglingTemperatureFirstPatternString = FrictionA11yStrings.frictionIncreasingAtomsJigglingTemperatureFirstPattern.value;
  const frictionIncreasingAtomsJigglingTemperaturePatternString = FrictionA11yStrings.frictionIncreasingAtomsJigglingTemperaturePattern.value;
  const capitalizedVeryHotString = FrictionA11yStrings.capitalizedVeryHot.value;
  const breakAwaySentenceFirstString = FrictionA11yStrings.breakAwaySentenceFirst.value;
  const breakAwaySentenceAgainString = FrictionA11yStrings.breakAwaySentenceAgain.value;

  // constants
  //TODO duplicated min/max constants with the screen view
  const THERMOMETER_MIN_TEMP = FrictionModel.MAGNIFIED_ATOMS_INFO.vibrationAmplitude.min - 1.05; // about 0
  const THERMOMETER_MAX_TEMP = FrictionModel.MAGNIFIED_ATOMS_INFO.evaporationLimit * 1.1; // 7.7???

  const THERMOMETER_RANGE = THERMOMETER_MAX_TEMP - THERMOMETER_MIN_TEMP;
  const DIVIDED_RANGE = THERMOMETER_RANGE / 9;

  // a11y - [cool, warm, hot, very hot]
  const AMPLITUDE_RANGES = [ new Range( THERMOMETER_MIN_TEMP, 2 * DIVIDED_RANGE ),
    new Range( 2 * DIVIDED_RANGE, 5 * DIVIDED_RANGE ),
    new Range( 5 * DIVIDED_RANGE, 8 * DIVIDED_RANGE ),
    new Range( 8 * DIVIDED_RANGE, 9 * DIVIDED_RANGE )
  ];
  const TEMPERATURE_ZONES = TemperatureZoneEnum.getOrdered();

  // sanity check to keep these in sync
  assert && assert( AMPLITUDE_RANGES.length === TEMPERATURE_ZONES.length );

  // break away sentences
  const BREAK_AWAY_THRESHOLD_FIRST = StringUtils.fillIn( breakAwaySentenceFirstString, { temp: capitalizedVeryHotString } );
  const BREAK_AWAY_THRESHOLD_AGAIN = StringUtils.fillIn( breakAwaySentenceAgainString, { temp: capitalizedVeryHotString } );

  var FrictionAlertManager = {

    /**
     * @param {object} alertObject - data object holding strings for alert, see this.ALERT_SCHEMA
     * @param {boolean} firstTimeAlerting - if it is the first time alerting this alert, there could be a special case in the data object
     * @param {string} [typeId]
     */
    alertTemperatureJiggleFromObject: function( alertObject, firstTimeAlerting, typeId ) {

      let patternString = frictionIncreasingAtomsJigglingTemperaturePatternString;

      // Use the "first time" pattern string if it is the first time.
      if ( alertObject.firstTime && firstTimeAlerting ) {
        patternString = frictionIncreasingAtomsJigglingTemperatureFirstPatternString;

        // use the fill in values for the first time
        alertObject = alertObject.firstTime;
      }

      var string = StringUtils.fillIn( patternString, {
        temperature: alertObject.temp,
        jigglingAmount: alertObject.jiggle
      } );
      utteranceQueue.addToBack( new Utterance( string, { typeId } ) );
      console.log( 'alertTemperatureJiggleFromObject stubbed, not doing anything' );
    },

    /**
     * Alert when the temperature has just reached the point where atoms begin to break away
     * @param {boolean} alertedBreakAwayBefore - whether or not the alert has been said before
     * @public
     */
    alertAtEvaporationThreshold: function( alertedBreakAwayBefore ) {
      utteranceQueue.addToFront( alertedBreakAwayBefore ? BREAK_AWAY_THRESHOLD_AGAIN : BREAK_AWAY_THRESHOLD_FIRST );
    },

    // Threshold that must be reached from initial temp to new temp to alert that the temperature changed, in amplitude (see model for more info)
    TEMPERATURE_ALERT_THRESHOLD: 1.5

  };


  friction.register( 'FrictionAlertManager', FrictionAlertManager );

  return FrictionAlertManager;
} );