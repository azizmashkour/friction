// Copyright 2013-2018, University of Colorado Boulder

/**
 * Shared constants for the 'Friction' simulation.
 *
 * @author Jesse Greenberg (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var friction = require( 'FRICTION/friction' );

  var FrictionConstants = {
    TOP_BOOK_COLOR_MACRO: 'rgb(125,226,249)', // color of the macroscopic view of the book
    TOP_BOOK_COLOR: 'rgb(125,226,249)', // color for the book in the magnified view
    TOP_BOOK_ATOMS_COLOR: 'rgb( 0, 255, 255 )', // color for the atoms in the magnified view
    BOTTOM_BOOK_COLOR_MACRO: 'rgb( 183, 255, 181 )', // color for the macroscopic view of the bottom book
    BOTTOM_BOOK_COLOR: 'rgb( 187, 255, 187 )', // color for the book in the magnified view
    BOTTOM_BOOK_ATOMS_COLOR: 'rgb( 0, 255, 0 )', // color for the bottom book in the magnified view,
    BOOK_TEXT_COLOR: '#404040',
    ATOM_RADIUS: 7 // in screen coordinates
  };

  friction.register( 'FrictionConstants', FrictionConstants );

  return FrictionConstants;
} );