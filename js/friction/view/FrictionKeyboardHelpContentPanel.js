// Copyright 2017-2018, University of Colorado Boulder

/**
 * Content for the "Hot Keys and Help" dialog that can be brought up from the sim navigation bar.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  const friction = require( 'FRICTION/friction' );
  const FrictionA11yStrings = require( 'FRICTION/friction/FrictionA11yStrings' );
  const GeneralNavigationHelpContent = require( 'SCENERY_PHET/keyboard/help/GeneralNavigationHelpContent' );
  const HBox = require( 'SCENERY/nodes/HBox' );
  const HelpContent = require( 'SCENERY_PHET/keyboard/help/HelpContent' );
  const inherit = require( 'PHET_CORE/inherit' );
  const Node = require( 'SCENERY/nodes/Node' );
  const Panel = require( 'SUN/Panel' );
  const RichText = require( 'SCENERY/nodes/RichText' );
  const VBox = require( 'SCENERY/nodes/VBox' );

  // strings
  const bookLabelString = require( 'string!FRICTION/bookLabel' );
  const bookTitleString = require( 'string!FRICTION/bookTitle' );
  const moveBookHeaderString = require( 'string!FRICTION/moveBookHeader' );
  const moveBookString = require( 'string!FRICTION/moveBook' );
  const moveInSmallerStepsString = require( 'string!FRICTION/moveInSmallerSteps' );

  // a11y strings
  const moveBookWithString = FrictionA11yStrings.moveBookWith.value;
  const moveInSmallerStepsWithString = FrictionA11yStrings.moveInSmallerStepsWith.value;

  // constants
  const DEFAULT_LABEL_OPTIONS = {
    font: HelpContent.DEFAULT_LABEL_FONT,
    maxWidth: HelpContent.DEFAULT_TEXT_MAX_WIDTH,
    lineWrap: HelpContent.DEFAULT_TEXT_MAX_WIDTH - 10 // extra value necessary for proper wrapping, see https://github.com/phetsims/friction/issues/138#issuecomment-442347693
  };

  /**
   * @constructor
   */
  function FrictionKeyboardHelpContentPanel() {

    const grabReleaseHelpContent = HelpContent.getGrabReleaseHelpContent( bookTitleString, bookLabelString );
    const moveBookHelpContent = new MoveBookHelpNode();
    const generalNavigationHelpContent = new GeneralNavigationHelpContent();

    HelpContent.alignHelpContentIcons( [ grabReleaseHelpContent, moveBookHelpContent ] );

    const content = new HBox( {
      children: [
        new VBox( { children: [ grabReleaseHelpContent, moveBookHelpContent ], spacing: 10, align: 'left' } ),
        generalNavigationHelpContent
      ],
      align: 'top',
      spacing: 30
    } );

    Panel.call( this, content, {
      stroke: null,
      fill: 'rgb( 214, 237, 249 )'
    } );
  }

  /**
   * @param {Object} [options]
   * @constructor
   */
  function MoveBookHelpNode( options ) {

    Node.call( this );
    options = _.extend( {

      // icon options
      arrowKeysScale: 0.55,
      verticalIconSpacing: HelpContent.DEFAULT_VERTICAL_ICON_SPACING

    }, options );

    // BookNode row
    const moveBookText = new RichText( moveBookString, DEFAULT_LABEL_OPTIONS );
    const moveBookIcon = HelpContent.arrowOrWasdKeysRowIcon();
    const moveBookRow = HelpContent.labelWithIcon( moveBookText, moveBookIcon, moveBookWithString );

    // BookNode in smaller steps row
    const moveInSmallerStepsText = new RichText( moveInSmallerStepsString, DEFAULT_LABEL_OPTIONS );
    const shiftPlusArrowKeys = HelpContent.shiftPlusIcon( HelpContent.arrowKeysRowIcon() );
    const shiftPlusWASDKeys = HelpContent.shiftPlusIcon( HelpContent.wasdRowIcon() );
    const row = HelpContent.labelWithIconList( moveInSmallerStepsText, [ shiftPlusArrowKeys, shiftPlusWASDKeys ], moveInSmallerStepsWithString );

    HelpContent.call( this, moveBookHeaderString, [ moveBookRow, row ], options );
  }

  inherit( HelpContent, MoveBookHelpNode );

  friction.register( 'FrictionKeyboardHelpContentPanel', FrictionKeyboardHelpContentPanel );

  return inherit( Panel, FrictionKeyboardHelpContentPanel );
} );