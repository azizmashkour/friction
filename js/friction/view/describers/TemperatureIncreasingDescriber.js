// Copyright 2018, University of Colorado Boulder

/**
 * This singleton type is responsible for alerting all aria-live alerts that pertain to the model/amplitude/temperature
 * increasing.
 * The basic algorithm: There is a list of alerts, each later alert uses verbage describing a relatively hotter model.
 * Each time you alert, you move up in the list, such that the next alert will alert with hotter verbage.
 *
 * The alert index restarts if there is enough time in between drags, signifying the end of the "drag session"
 * A drag session can consist of more than one dragging instance, but is ended if the time between drags is greater than
 * the "DRAG_SESSION_THRESHOLD"
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */
define( ( require ) => {
  'use strict';

  // modules
  const friction = require( 'FRICTION/friction' );
  const FrictionA11yStrings = require( 'FRICTION/friction/FrictionA11yStrings' );
  const FrictionAlertManager = require( 'FRICTION/friction/view/FrictionAlertManager' );
  const FrictionModel = require( 'FRICTION/friction/model/FrictionModel' );
  const FrictionQueryParameters = require( 'FRICTION/friction/FrictionQueryParameters' );
  const StringUtils = require( 'PHETCOMMON/util/StringUtils' );
  const timer = require( 'PHET_CORE/timer' );
  const Utterance = require( 'SCENERY_PHET/accessibility/Utterance' );
  const utteranceQueue = require( 'SCENERY_PHET/accessibility/utteranceQueue' );

  // a11y strings
  const moreString = FrictionA11yStrings.more.value;
  const fasterString = FrictionA11yStrings.faster.value;
  const nowHotterString = FrictionA11yStrings.nowHotter.value;
  const evenFasterString = FrictionA11yStrings.evenFaster.value;
  const warmerString = FrictionA11yStrings.warmer.value;
  const evenHotterString = FrictionA11yStrings.evenHotter.value;

  const superFastString = FrictionA11yStrings.superFast.value;
  const superHotString = FrictionA11yStrings.superHot.value;

  const resetSimMoreObservationSentenceString = FrictionA11yStrings.resetSimMoreObservationSentence.value;
  const frictionIncreasingAtomsJigglingTemperaturePatternString = FrictionA11yStrings.frictionIncreasingAtomsJigglingTemperaturePattern.value;

  // alert object for the Maximum temp alert
  const MAX_TEMP_STRING = StringUtils.fillIn( frictionIncreasingAtomsJigglingTemperaturePatternString, {
    jigglingAmount: superFastString,
    temperature: superHotString
  } );

  const INCREASING = [
    {
      jiggle: moreString,
      temp: warmerString
    },
    {
      jiggle: fasterString,
      temp: nowHotterString
    },
    {
      jiggle: evenFasterString,
      temp: evenHotterString
    }
  ];

  // From model, the amplitude value when the atoms evaporate
  const EVAPORATION_LIMIT = FrictionModel.MAGNIFIED_ATOMS_INFO.evaporationLimit;

  // in ms, how long to wait until we consider this newest drag of a different "drag session"
  const DRAG_SESSION_THRESHOLD = FrictionQueryParameters.dragSessionThreshold;

  // time in between each increasing alert
  const ALERT_TIME_DELAY = FrictionQueryParameters.warmingAlertTimeDelay;

  // the singleton instance of this describer, used for the entire instance of the sim.
  let describer = null;

  /**
   * Responsible for alerting when the temperature increases
   * @param {Object} [options]
   * @constructor
   */
  class TemperatureIncreasingDescriber {
    constructor( model ) {

      // @private
      this.model = model;

      // @private
      // Keep track of the time that the last drag ended. This is helpful to see if a new drag is within the same
      // "drag session", meaning that the alertIndex doesn't reset back to the first alert.
      // Default value is such that restart will always occur on first drag.
      this.timeOfLastDrag = 0;

      // @private
      this.initialAmplitude = model.amplitudeProperty.value;

      // zero indexed, so the first one is 0
      // @private
      this.alertIndex = -1;

      // {boolean} don't alert too many alerts all at once, this is only switched after a timeout, see alertIncrease
      // @private
      this.tooSoonForNextAlert = false;

      this.maxTempUtterance = new Utterance( {
        alert: [ MAX_TEMP_STRING, MAX_TEMP_STRING, resetSimMoreObservationSentenceString ],
        uniqueGroupId: 'increasing',
        loopAlerts: true
      } );

      // @private
      // TODO: performance: put in drag callback instead?
      this.amplitudeListener = ( amplitude ) => {

        if ( !this.tooSoonForNextAlert && // don't alert a subsequent alert too quickly

             // the difference in amplitude has to be greater than the threshold to alert
             amplitude - this.initialAmplitude > FrictionAlertManager.TEMPERATURE_ALERT_THRESHOLD ) {

          if ( amplitude < EVAPORATION_LIMIT ) {
            this.alertIncrease();
          }
          else {
            this.alertMaxTemp();
          }
        }

      };

      // exists for the lifetime of the sim, no need to dispose
      this.model.amplitudeProperty.link( this.amplitudeListener );
    }

    // @public
    // triggered on every keydown/mousedown
    startDrag() {

      // If longer than threshold, treat as new "drag session"
      if ( phet.joist.elapsedTime - this.timeOfLastDrag > DRAG_SESSION_THRESHOLD ) {
        this.alertIndex = -1; //reset
        this.initialAmplitude = this.model.amplitudeProperty.value;
      }
    }

    // @public
    endDrag() {
      this.timeOfLastDrag = phet.joist.elapsedTime;
    }

    // @private
    alertIncrease() {
      this.alertIndex++;
      let currentAlertIndex = Math.min( this.alertIndex, INCREASING.length - 1 );

      let alertObject = INCREASING[ currentAlertIndex ];

      this.alert( () => {
        FrictionAlertManager.alertTemperatureJiggleFromObject( alertObject, false, 'increasing' );
      } );
    }

    /**
     * Alert the maximum temperate alert, varried based on if it is the first time alerting.
     * @private
     */
    alertMaxTemp() {

      this.alert( () => { utteranceQueue.addToBack( this.maxTempUtterance ); } );
    }

    /**
     * General alert for this type, manages the timing and threshold values to make sure that alerts
     * happen at the right moments.
     * @param {function} alertFunction
     * @private
     */
    alert( alertFunction ) {
      alertFunction();

      // set to true to limit subsequent alerts firing rapidly
      this.tooSoonForNextAlert = true;

      // reset the "initialAmplitude" to the current amplitude, because then it will take another whole threshold level to alert again
      this.initialAmplitude = this.model.amplitudeProperty.value;

      // This is a bit buggy, we may want to tweak the threshold more, or find a better solution.
      timer.setTimeout( () => { this.tooSoonForNextAlert = false; }, ALERT_TIME_DELAY );
    }

    /**
     * Reset the Describer
     * @public
     */
    reset() {
      this.maxTempUtterance.reset(); // reset the maximum alerts
    }

    /**
     * Uses the singleton pattern to keep one instance of this describer for the entire lifetime of the sim.
     * @returns {TemperatureIncreasingDescriber}
     */
    static getDescriber() {
      assert && assert( describer, 'describer has not yet been initialized' );
      return describer;
    }

    /**
     * Initialize the describer singleton
     * @param {FrictionModel} model
     * @returns {TemperatureIncreasingDescriber}
     */
    static initialize( model ) {
      describer = new TemperatureIncreasingDescriber( model );
      return describer;
    }
  }

  return friction.register( 'TemperatureIncreasingDescriber', TemperatureIncreasingDescriber );
} );