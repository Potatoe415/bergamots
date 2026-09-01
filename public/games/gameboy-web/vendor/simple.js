/*
 * Copyright (C) 2020 Ben Smith
 *
 * This software may be modified and distributed under the terms
 * of the MIT license.  See the LICENSE file for details.
 *
 *
 * Some code from GB-Studio, see LICENSE.gbstudio
 */
"use strict";

// User configurable.
// Absolute path (server root) of the folder scanned for .gb/.gbc files by
// the splash/game-select screen. Drop ROMs in there, reload, pick one.
const ROM_DIR = './ROM/';
const uploadedRomBuffers = new Map();
const ENABLE_FAST_FORWARD = true;
const ENABLE_REWIND = true;
const ENABLE_PAUSE = true;
const ENABLE_SWITCH_PALETTES = true;
const CGB_COLOR_CURVE = 2;    // 0: none, 1: Sameboy "Emulate Hardware" 2: Gambatte/Gameboy Online

// List of DMG palettes to switch between. By default it includes all 84
// built-in palettes. If you want to restrict this, change it to an array of
// the palettes you want to use and change DEFAULT_PALETTE_IDX to the index of the
// default palette in that list.
//
// Example: (only allow one palette with index 16):
//   const DEFAULT_PALETTE_IDX = 0;
//   const PALETTES = [16];
//
// Example: (allow three palettes, 16, 32, 64, with default 32):
//   const DEFAULT_PALETTE_IDX = 1;
//   const PALETTES = [16, 32, 64];
//
const DEFAULT_PALETTE_IDX = 79;
const PALETTES = [
  0,  1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12, 13, 14, 15, 16,
  17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33,
  34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50,
  51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67,
  68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83,
];

// The index (into the builtin-palette table, i.e. an id, not a PALETTES
// array index) of the palette that most closely matches the real DMG-01
// screen's pea-soup green, so it can be highlighted/preselected as "the"
// original Game Boy look. The other one is the actual "Default CGB
// palette" (see builtin-palettes.def), i.e. what a Game Boy Color shows
// for a DMG game with no boot-screen color chosen. Both are pinned to the
// top of the Colors dialog (in that order) so they're the easiest to find.
const ORIGINAL_GB_PALETTE_ID = 62;
const GBC_DEFAULT_PALETTE_ID = 38;
const PINNED_PALETTE_IDS = [ORIGINAL_GB_PALETTE_ID, GBC_DEFAULT_PALETTE_ID];

// One entry per builtin palette (see binjgb/src/builtin-palettes.def).
// `name` is a translation key (STRINGS.*.palette_name_N); `swatch` is the
// 4 background-palette colors, used to draw a little color preview so
// players can recognize a palette (e.g. the original Game Boy green,
// Pokemon red/blue, Zelda, ...) without having to try them all one by one.
const PALETTE_INFO = [
  {swatch: ['#ffffff', '#aaaaaa', '#555555', '#000000']},
  {swatch: ['#ffffff', '#00ff52', '#0042ff', '#000000']},
  {swatch: ['#ffffff', '#00ffff', '#0000ff', '#000000']},
  {swatch: ['#ffffff', '#63adff', '#003184', '#000000']},
  {swatch: ['#000000', '#848400', '#00deff', '#ffffff']},
  {swatch: ['#ffffff', '#a5a5a5', '#525252', '#000000']},
  {swatch: ['#a5ffff', '#9494ff', '#ff9494', '#000000']},
  {swatch: ['#c5e6ff', '#849cce', '#296b84', '#08315a']},
  {swatch: ['#ffffff', '#31ff7b', '#c56300', '#000000']},
  {swatch: ['#ffffff', '#de8c8c', '#8c5252', '#000000']},
  {swatch: ['#ffffff', '#8484ff', '#3a3a94', '#000000']},
  {swatch: ['#ffffff', '#ffa563', '#ff0000', '#000000']},
  {swatch: ['#ffffff', '#00ffff', '#004a7b', '#000000']},
  {swatch: ['#ffffff', '#009cff', '#0000ff', '#000000']},
  {swatch: ['#ffffff', '#00ffff', '#0000ff', '#000000']},
  {swatch: ['#ff9ca5', '#00ffff', '#006300', '#000000']},
  {swatch: ['#ffffff', '#63adff', '#003184', '#000000']},
  {swatch: ['#000000', '#848400', '#00deff', '#ffffff']},
  {swatch: ['#ffffff', '#a5a5a5', '#525252', '#000000']},
  {swatch: ['#ffffff', '#00ceff', '#00639c', '#000000']},
  {swatch: ['#ffffff', '#84adad', '#7b7342', '#000000']},
  {swatch: ['#ffffff', '#ffa563', '#ff0000', '#000000']},
  {swatch: ['#ffffff', '#de8c8c', '#8c5252', '#000000']},
  {swatch: ['#ffffff', '#8484ff', '#3a3a94', '#000000']},
  {swatch: ['#ffffff', '#31ff7b', '#c56300', '#000000']},
  {swatch: ['#ffffff', '#ffa563', '#ff0000', '#000000']},
  {swatch: ['#ffffff', '#de8c8c', '#8c5252', '#000000']},
  {swatch: ['#ffffff', '#84adad', '#7b7342', '#000000']},
  {swatch: ['#ffffff', '#00ff7b', '#0073b5', '#000000']},
  {swatch: ['#ffffff', '#00ff52', '#0042ff', '#000000']},
  {swatch: ['#ffffff', '#009cff', '#0000ff', '#000000']},
  {swatch: ['#ff9ca5', '#00ffff', '#006300', '#000000']},
  {swatch: ['#ffb5b5', '#94ffff', '#425aad', '#000000']},
  {swatch: ['#ffffff', '#de8c8c', '#8c5252', '#000000']},
  {swatch: ['#ffffff', '#de8c8c', '#8c5252', '#000000']},
  {swatch: ['#ffffff', '#31ff7b', '#008400', '#000000']},
  {swatch: ['#ffffff', '#63adff', '#003184', '#000000']},
  {swatch: ['#ffffff', '#63adff', '#003184', '#000000']},
  {swatch: ['#ffffff', '#31ff7b', '#c56300', '#000000']},
  {swatch: ['#ffffff', '#31ff7b', '#c56300', '#000000']},
  {swatch: ['#ffffff', '#00ff52', '#0042ff', '#000000']},
  {swatch: ['#ffffff', '#009cff', '#0000ff', '#000000']},
  {swatch: ['#ffffff', '#00ffff', '#0000ff', '#000000']},
  {swatch: ['#ffffff', '#84adad', '#7b7342', '#000000']},
  {swatch: ['#9cffff', '#ffb594', '#739463', '#3a3a00']},
  {swatch: ['#00ff6b', '#ffffff', '#4a52ff', '#000000']},
  {swatch: ['#00de52', '#0084ff', '#00ffff', '#ffffff']},
  {swatch: ['#ff9ca5', '#00ffff', '#006300', '#000000']},
  {swatch: ['#ceffff', '#efef63', '#31849c', '#5a5a5a']},
  {swatch: ['#ffffff', '#ffa563', '#ff0000', '#000000']},
  {swatch: ['#ffffff', '#de8c8c', '#8c5252', '#000000']},
  {swatch: ['#ffffff', '#de8c8c', '#8c5252', '#000000']},
  {swatch: ['#ffffff', '#31ff7b', '#008400', '#000000']},
  {swatch: ['#ffffff', '#63adff', '#003184', '#000000']},
  {swatch: ['#ffffff', '#8484ff', '#3a3a94', '#000000']},
  {swatch: ['#ffffff', '#63adff', '#003184', '#000000']},
  {swatch: ['#ffffff', '#ffa563', '#ff0000', '#000000']},
  {swatch: ['#ffffff', '#84adad', '#7b7342', '#000000']},
  {swatch: ['#ffffff', '#31ff7b', '#c56300', '#000000']},
  {swatch: ['#e4f3e2', '#44e394', '#8f8746', '#502c33']},
  {swatch: ['#b5ffff', '#7bc67b', '#428c6b', '#21395a']},
  {swatch: ['#c6e7f7', '#498ed6', '#2537a6', '#501e33']},
  {swatch: ['#d0f8e0', '#70c088', '#566834', '#201808']},
  {swatch: ['#ffefff', '#8cb5f7', '#9c7384', '#101018']},
  {swatch: ['#c2e4ff', '#56a4dc', '#4c60a9', '#362942']},
  {swatch: ['#cecece', '#df9e6f', '#8e6742', '#332510']},
  {swatch: ['#d3f6ff', '#75a8f9', '#6f6beb', '#583f7c']},
  {swatch: ['#c2f0c4', '#a8b95a', '#6e601e', '#001b2d']},
  {swatch: ['#6bb5ac', '#488476', '#3f503f', '#373124']},
  {swatch: ['#a1b4ed', '#6868a9', '#624476', '#37212c']},
  {swatch: ['#ddf5ff', '#6bb2f4', '#9165b7', '#6c2965']},
  {swatch: ['#f7bef7', '#8686e7', '#e73377', '#962c2c']},
  {swatch: ['#16847e', '#467b57', '#495d38', '#3d462e']},
  {swatch: ['#c0eee3', '#89baae', '#45675e', '#202020']},
  {swatch: ['#b4f4db', '#96c3ab', '#78927b', '#5a624c']},
  {swatch: ['#a1cfc4', '#6d958b', '#3c534d', '#1f1f1f']},
  {swatch: ['#1edfae', '#5825b6', '#607e04', '#00172c']},
  {swatch: ['#8cefa1', '#95ac3f', '#766144', '#37212c']},
  {swatch: ['#f3e8e7', '#c3838c', '#8f4d63', '#190b12']},
  {swatch: ['#f7f7ce', '#508ef7', '#00009e', '#00001e']},
  {swatch: ['#77ddeb', '#00bca1', '#33880d', '#334300']},
  {swatch: ['#b6f7ef', '#77a6df', '#00c611', '#000000']},
  {swatch: ['#ffe58b', '#cf8f60', '#e85075', '#4c2e62']},
  {swatch: ['#deffef', '#94d7ad', '#739252', '#423418']},
];

// It's probably OK to leave these alone. But you can tweak them to get better
// rewind performance.
const REWIND_FRAMES_PER_BASE_STATE = 45;  // How many delta frames until keyframe
const REWIND_BUFFER_CAPACITY = 4 * 1024 * 1024;  // Total rewind capacity
const REWIND_FACTOR = 1.5;    // How fast is rewind compared to normal speed
const REWIND_UPDATE_MS = 16;  // Rewind setInterval rate

// Probably OK to leave these alone too.
const AUDIO_FRAMES = 4096;      // Number of audio frames pushed per buffer
const AUDIO_LATENCY_SEC = 0.1;
const MAX_UPDATE_SEC = 5 / 60;  // Max. time to run emulator per step (== 5 frames)

// Constants
const RESULT_OK = 0;
const RESULT_ERROR = 1;
const SCREEN_WIDTH = 160;
const SCREEN_HEIGHT = 144;
const CPU_TICKS_PER_SECOND = 4194304;
const EVENT_NEW_FRAME = 1;
const EVENT_AUDIO_BUFFER_FULL = 2;
const EVENT_UNTIL_TICKS = 4;

// Pseudo touch-identifier used to track a mouse press in the very same
// activeTouchIds Set as real touches (see Emulator.prototype.bindTouch).
const MOUSE_POINTER_ID = 'mouse';

const $ = document.querySelector.bind(document);
let emulator = null;

const controllerEl = $('#controller');
const selectEl = $('#controller_select');
const startEl = $('#controller_start');
const bEl = $('#controller_b');
const aEl = $('#controller_a');
const dpadUpEl = $('#controller_up');
const dpadDownEl = $('#controller_down');
const dpadLeftEl = $('#controller_left');
const dpadRightEl = $('#controller_right');
const dpadUlEl = $('#controller_ul');
const dpadUrEl = $('#controller_ur');
const dpadDlEl = $('#controller_dl');
const dpadDrEl = $('#controller_dr');

const splashEl = $('#splash');
const splashListEl = $('#splash_list');
const splashEmptyEl = $('#splash_empty');
const openRomBtnEl = $('#openRomBtn');
const openRomInputEl = $('#openRomInput');
const splashMenuBtnEl = $('#splashMenuBtn');
const splashMenuEl = $('#splashMenu');
const gameHeaderEl = $('#gameHeader');
const headerPauseBtnEl = $('#headerPauseBtn');
const headerMuteBtnEl = $('#headerMuteBtn');
const menuBtnEl = $('#menuBtn');
const gameMenuEl = $('#gameMenu');
const menuExportSaveBtnEl = $('#menuExportSaveBtn');
const importSaveInputEl = $('#importSaveInput');
const splashHelpLinkEl = $('#splash_help_link');
const helpDialogEl = $('#helpDialog');
const helpTableEl = $('#helpTable');
const helpCloseBtnEl = $('#helpCloseBtn');
const splashLanguageLinkEl = $('#splash_language_link');
const languageDialogEl = $('#languageDialog');
const languageOptionsEl = $('#languageOptions');
const languageCloseBtnEl = $('#languageCloseBtn');
const colorsDialogEl = $('#colorsDialog');
const colorOptionsEl = $('#colorOptions');
const colorsCloseBtnEl = $('#colorsCloseBtn');

// ---------------------------------------------------------------------- //
// i18n. Default language is English; the only other one for now is      //
// French. Every UI string lives here -- nothing is hardcoded elsewhere.  //
// ---------------------------------------------------------------------- //

const DEFAULT_LANG = 'en';
const LANG_STORAGE_KEY = 'lang';

const STRINGS = {
  en: {
    splash_subtitle: 'Choose a cartridge',
    splash_empty_html:
        'No ROMs yet.<br>Open a <code>.gb</code> / <code>.gbc</code> file ' +
        'to play. Files stay on this device.',
    open_rom: 'Open ROM file',
    hub_back: 'Back to hub',
    splash_help_link: 'View keyboard controls (PC)',
    splash_language_link: 'Language / Langue',
    menu_title_attr: 'Menu',
    menu_pause: 'Pause',
    menu_resume: 'Resume',
    menu_mute: 'Mute',
    menu_unmute: 'Unmute',
    menu_save: 'Save game',
    menu_load: 'Load save',
    menu_export_save: 'Export save (.sav)',
    menu_import_save: 'Import save (.sav)',
    menu_reset: 'Reset game',
    menu_help: 'Controls (keyboard)',
    menu_quit: 'Back to game selection',
    menu_language: 'Language',
    menu_colors: 'Colors...',
    colors_dialog_title: 'Colors',
    colors_dialog_subtitle:
        'Pick a palette. For an original Game Boy game, choose ' +
        '"Game Boy (original green)" below.',
    toast_saved: 'Game saved',
    toast_loaded: 'Save loaded',
    toast_save_exported: 'Save exported',
    toast_save_imported: 'Save imported',
    toast_no_save_data: 'This game has no cartridge save data',
    toast_import_failed: 'Invalid save file for this game',
    help_title: 'Keyboard controls (PC)',
    help_dpad: 'D-Pad (movement)',
    help_b: 'B button',
    help_a: 'A button',
    help_start: 'Start',
    help_select: 'Select',
    help_rewind: 'Rewind (hold)',
    help_pause: 'Pause / Resume',
    help_palette: 'Previous / next palette',
    help_fastforward: 'Fast-forward (hold)',
    help_save: 'Save game',
    help_load: 'Load save',
    key_enter: 'Enter',
    key_backspace: 'Backspace',
    key_space: 'Space',
    key_shift_left: 'Left Shift',
    dialog_close: 'Close',
    lang_dialog_title: 'Language',
    palette_name_0: 'Grayscale',
    palette_name_1: 'Right (GBC boot)',
    palette_name_2: 'A + Down (GBC boot)',
    palette_name_3: 'Up (GBC boot)',
    palette_name_4: 'B + Right (GBC boot)',
    palette_name_5: 'B + Left (GBC boot)',
    palette_name_6: 'Down (GBC boot)',
    palette_name_7: 'B + Up (GBC boot)',
    palette_name_8: 'A + Right (GBC boot)',
    palette_name_9: 'A + Left (GBC boot)',
    palette_name_10: 'A + Up (GBC boot)',
    palette_name_11: 'Left (GBC boot)',
    palette_name_12: 'B + Down (GBC boot)',
    palette_name_13: 'Balloon Kid / Tetris Blast',
    palette_name_14: 'Tetris / Pikachu',
    palette_name_15: 'Alleyway',
    palette_name_16: 'Yakuman / Picross',
    palette_name_17: 'Space Invaders',
    palette_name_18: 'X (GBC boot)',
    palette_name_19: 'Pocket Camera',
    palette_name_20: 'Radar Mission',
    palette_name_21: 'Pokémon Blue',
    palette_name_22: 'Kaeru no Tame ni Kane wa Naru',
    palette_name_23: 'Pokémon Red',
    palette_name_24: 'James Bond 007 / Pokémon Green',
    palette_name_25: 'Dr. Mario',
    palette_name_26: 'Pinocchio',
    palette_name_27: 'Mole Mania',
    palette_name_28: 'Game Boy Gallery',
    palette_name_29: 'Yoshi',
    palette_name_30: 'Donkey Kong',
    palette_name_31: "Kirby's Pinball Land",
    palette_name_32: 'Super Mario Land',
    palette_name_33: 'Pocket Bomberman',
    palette_name_34: 'Kid Icarus',
    palette_name_35: 'Play Action Football',
    palette_name_36: 'Chessmaster',
    palette_name_37: 'Battletoads',
    palette_name_38: 'Game Boy Color (default)',
    palette_name_39: 'Tetris Plus',
    palette_name_40: 'Tetris Attack',
    palette_name_41: "Yoshi's Cookie",
    palette_name_42: 'Qix / Tetris 2',
    palette_name_43: 'Wario Land',
    palette_name_44: 'Donkey Kong Land',
    palette_name_45: 'Tennis',
    palette_name_46: 'Baseball',
    palette_name_47: "Kirby's Dream Land",
    palette_name_48: 'Super Mario Land 2',
    palette_name_49: 'Wave Race',
    palette_name_50: 'Donkey Kong Land 2/3',
    palette_name_51: 'Killer Instinct',
    palette_name_52: 'Othello',
    palette_name_53: 'Mega Man',
    palette_name_54: "Zelda: Link's Awakening",
    palette_name_55: 'Star Wars',
    palette_name_56: 'Metroid II',
    palette_name_57: 'Wario Land II',
    palette_name_58: 'Pac-In-Time',
    palette_name_59: 'Kirokaze',
    palette_name_60: "Link's Awakening (SGB)",
    palette_name_61: 'Super Game Boy',
    palette_name_62: 'Game Boy (original green)',
    palette_name_63: 'Pokémon (BGB style)',
    palette_name_64: 'GB Chocolate',
    palette_name_65: 'Mega Man V (SGB)',
    palette_name_66: 'Ice Cream GB',
    palette_name_67: 'Mist GB',
    palette_name_68: 'Arne',
    palette_name_69: 'Rustic',
    palette_name_70: 'Grapefruit',
    palette_name_71: 'Kirby (SGB)',
    palette_name_72: 'Black Zero',
    palette_name_73: 'Andrade',
    palette_name_74: 'Game Boy Pocket (green)',
    palette_name_75: 'PJ GB',
    palette_name_76: 'Metroid II (SGB)',
    palette_name_77: 'Nymph GB',
    palette_name_78: 'Darkboy4',
    palette_name_79: 'Kid Icarus (SGB)',
    palette_name_80: 'Easy Greens',
    palette_name_81: 'Super Mario Land 2 (SGB)',
    palette_name_82: 'Wish GB',
    palette_name_83: 'GB Studio',
  },
  fr: {
    splash_subtitle: 'Choisis une cartouche',
    splash_empty_html:
        'Aucune ROM pour l\'instant.<br>Ouvre un fichier ' +
        '<code>.gb</code> / <code>.gbc</code> pour jouer. Les fichiers ' +
        'restent sur cet appareil.',
    open_rom: 'Ouvrir une ROM',
    hub_back: 'Retour au hub',
    splash_help_link: 'Voir les commandes clavier (PC)',
    splash_language_link: 'Language / Langue',
    menu_title_attr: 'Menu',
    menu_pause: 'Mettre en pause',
    menu_resume: 'Reprendre',
    menu_mute: 'Muet',
    menu_unmute: 'Réactiver le son',
    menu_save: 'Sauvegarder la partie',
    menu_load: 'Charger la sauvegarde',
    menu_export_save: 'Exporter la sauvegarde (.sav)',
    menu_import_save: 'Importer une sauvegarde (.sav)',
    menu_reset: 'Réinitialiser le jeu',
    menu_help: 'Commandes (clavier)',
    menu_quit: 'Retour à la sélection des jeux',
    menu_language: 'Langue',
    menu_colors: 'Couleurs...',
    colors_dialog_title: 'Couleurs',
    colors_dialog_subtitle:
        'Choisis une palette. Pour un jeu Game Boy original, choisis ' +
        '« Game Boy (vert original) » ci-dessous.',
    toast_saved: 'Partie sauvegardée',
    toast_loaded: 'Sauvegarde chargée',
    toast_save_exported: 'Sauvegarde exportée',
    toast_save_imported: 'Sauvegarde importée',
    toast_no_save_data: "Ce jeu n'a pas de sauvegarde cartouche",
    toast_import_failed: 'Fichier de sauvegarde invalide pour ce jeu',
    help_title: 'Commandes clavier (PC)',
    help_dpad: 'D-Pad (déplacement)',
    help_b: 'Bouton B',
    help_a: 'Bouton A',
    help_start: 'Start',
    help_select: 'Select',
    help_rewind: 'Rembobiner (maintenir)',
    help_pause: 'Pause / Reprendre',
    help_palette: 'Palette précédente / suivante',
    help_fastforward: 'Avance rapide (maintenir)',
    help_save: 'Sauvegarder la partie',
    help_load: 'Charger la sauvegarde',
    key_enter: 'Entrée',
    key_backspace: 'Retour arrière',
    key_space: 'Espace',
    key_shift_left: 'Maj (gauche)',
    dialog_close: 'Fermer',
    lang_dialog_title: 'Langue',
    palette_name_0: 'Niveaux de gris',
    palette_name_1: 'Droite (démarrage GBC)',
    palette_name_2: 'A + Bas (démarrage GBC)',
    palette_name_3: 'Haut (démarrage GBC)',
    palette_name_4: 'B + Droite (démarrage GBC)',
    palette_name_5: 'B + Gauche (démarrage GBC)',
    palette_name_6: 'Bas (démarrage GBC)',
    palette_name_7: 'B + Haut (démarrage GBC)',
    palette_name_8: 'A + Droite (démarrage GBC)',
    palette_name_9: 'A + Gauche (démarrage GBC)',
    palette_name_10: 'A + Haut (démarrage GBC)',
    palette_name_11: 'Gauche (démarrage GBC)',
    palette_name_12: 'B + Bas (démarrage GBC)',
    palette_name_13: 'Balloon Kid / Tetris Blast',
    palette_name_14: 'Tetris / Pikachu',
    palette_name_15: 'Alleyway',
    palette_name_16: 'Yakuman / Picross',
    palette_name_17: 'Space Invaders',
    palette_name_18: 'X (démarrage GBC)',
    palette_name_19: 'Pocket Camera',
    palette_name_20: 'Radar Mission',
    palette_name_21: 'Pokémon Bleu',
    palette_name_22: 'Kaeru no Tame ni Kane wa Naru',
    palette_name_23: 'Pokémon Rouge',
    palette_name_24: 'James Bond 007 / Pokémon Vert',
    palette_name_25: 'Dr. Mario',
    palette_name_26: 'Pinocchio',
    palette_name_27: 'Mole Mania',
    palette_name_28: 'Game Boy Gallery',
    palette_name_29: 'Yoshi',
    palette_name_30: 'Donkey Kong',
    palette_name_31: "Kirby's Pinball Land",
    palette_name_32: 'Super Mario Land',
    palette_name_33: 'Pocket Bomberman',
    palette_name_34: 'Kid Icarus',
    palette_name_35: 'Play Action Football',
    palette_name_36: 'Chessmaster',
    palette_name_37: 'Battletoads',
    palette_name_38: 'Game Boy Color (par défaut)',
    palette_name_39: 'Tetris Plus',
    palette_name_40: 'Tetris Attack',
    palette_name_41: "Yoshi's Cookie",
    palette_name_42: 'Qix / Tetris 2',
    palette_name_43: 'Wario Land',
    palette_name_44: 'Donkey Kong Land',
    palette_name_45: 'Tennis',
    palette_name_46: 'Baseball',
    palette_name_47: "Kirby's Dream Land",
    palette_name_48: 'Super Mario Land 2',
    palette_name_49: 'Wave Race',
    palette_name_50: 'Donkey Kong Land 2/3',
    palette_name_51: 'Killer Instinct',
    palette_name_52: 'Othello',
    palette_name_53: 'Mega Man',
    palette_name_54: "Zelda : Link's Awakening",
    palette_name_55: 'Star Wars',
    palette_name_56: 'Metroid II',
    palette_name_57: 'Wario Land II',
    palette_name_58: 'Pac-In-Time',
    palette_name_59: 'Kirokaze',
    palette_name_60: "Link's Awakening (SGB)",
    palette_name_61: 'Super Game Boy',
    palette_name_62: 'Game Boy (vert original)',
    palette_name_63: 'Pokémon (style BGB)',
    palette_name_64: 'GB Chocolate',
    palette_name_65: 'Mega Man V (SGB)',
    palette_name_66: 'Ice Cream GB',
    palette_name_67: 'Mist GB',
    palette_name_68: 'Arne',
    palette_name_69: 'Rustic',
    palette_name_70: 'Grapefruit',
    palette_name_71: 'Kirby (SGB)',
    palette_name_72: 'Black Zero',
    palette_name_73: 'Andrade',
    palette_name_74: 'Game Boy Pocket (vert)',
    palette_name_75: 'PJ GB',
    palette_name_76: 'Metroid II (SGB)',
    palette_name_77: 'Nymph GB',
    palette_name_78: 'Darkboy4',
    palette_name_79: 'Kid Icarus (SGB)',
    palette_name_80: 'Easy Greens',
    palette_name_81: 'Super Mario Land 2 (SGB)',
    palette_name_82: 'Wish GB',
    palette_name_83: 'GB Studio',
  },
};

// Language names are always shown in their own language (e.g. "Français"
// even from the English UI), so they're not part of STRINGS.
const LANG_NAMES = {en: 'English', fr: 'Français'};

const storedLang = localStorage.getItem(LANG_STORAGE_KEY);
let currentLang = STRINGS[storedLang] ? storedLang : DEFAULT_LANG;

function t(key) {
  return (STRINGS[currentLang] && STRINGS[currentLang][key]) ||
      STRINGS[DEFAULT_LANG][key] || key;
}

function setLanguage(lang) {
  if (!STRINGS[lang]) return;
  currentLang = lang;
  localStorage.setItem(LANG_STORAGE_KEY, lang);
  applyI18n();
}

function applyI18n() {
  document.documentElement.lang = currentLang;

  for (const el of document.querySelectorAll('[data-i18n]')) {
    el.textContent = t(el.dataset.i18n);
  }
  for (const el of document.querySelectorAll('[data-i18n-html]')) {
    el.innerHTML = t(el.dataset.i18nHtml);
  }
  for (const el of document.querySelectorAll('[data-i18n-title]')) {
    el.title = t(el.dataset.i18nTitle);
  }

  updatePauseUI();
  updateMuteUI();

  for (const el of languageOptionsEl.querySelectorAll('.langOption')) {
    el.classList.toggle('active', el.dataset.lang === currentLang);
  }

  renderHelpTable();
  renderColorOptions();
}

// Keeps the always-visible header icon in sync, no matter which of the two
// controls (header icon or the Space key) actually toggled the pause state.
function updatePauseUI() {
  const label = vm.paused ? t('menu_resume') : t('menu_pause');
  headerPauseBtnEl.textContent = vm.paused ? '\u25b6' : '\u23f8';
  headerPauseBtnEl.title = label;
}

function updateMuteUI() {
  const label = vm.muted ? t('menu_unmute') : t('menu_mute');
  headerMuteBtnEl.textContent = vm.muted ? '\u{1F507}' : '\u{1F50A}';
  headerMuteBtnEl.title = label;
}

// Description of the keyboard shortcuts wired up in
// Emulator.prototype.bindKeys(), shown in the "Controls" help dialog.
// Built fresh every time so it always reflects the current language.
function getKeyHelp() {
  return [
    {keys: '↑ ↓ ← →', action: t('help_dpad')},
    {keys: 'Z', action: t('help_b')},
    {keys: 'X', action: t('help_a')},
    {keys: t('key_enter'), action: t('help_start')},
    {keys: 'Tab', action: t('help_select')},
    ...(ENABLE_REWIND ? [{keys: t('key_backspace'), action: t('help_rewind')}] :
                         []),
    ...(ENABLE_PAUSE ? [{keys: t('key_space'), action: t('help_pause')}] : []),
    ...(ENABLE_SWITCH_PALETTES ?
            [{keys: '[  /  ]', action: t('help_palette')}] :
            []),
    ...(ENABLE_FAST_FORWARD ?
            [{keys: t('key_shift_left'), action: t('help_fastforward')}] :
            []),
    {keys: 'F6', action: t('help_save')},
    {keys: 'F9', action: t('help_load')},
  ];
}

// Name of the ROM currently loaded, used to namespace save-data/ext-ram
// localStorage keys so multiple games don't clobber each other's saves.
let currentRomFilename = null;

// The chosen color palette is global (not per-ROM) and picked *before* a
// game is even loaded (splash screen menu), so it must be read from
// localStorage right away rather than only once a game starts.
const PALETTE_STORAGE_KEY = 'palIdx';

function loadStoredPaletteIdx() {
  const stored = parseInt(localStorage.getItem(PALETTE_STORAGE_KEY), 10);
  return Number.isInteger(stored) && stored >= 0 && stored < PALETTES.length ?
      stored :
      DEFAULT_PALETTE_IDX;
}

const binjgbPromise = Binjgb();

// Extract stuff from the vue.js implementation in demo.js.
class VM {
  constructor() {
    this.ticks = 0;
    this.extRamUpdated = false;
    this.paused_ = false;
    this.volume = 0.5;
    this.muted = false;
    this.palIdx = loadStoredPaletteIdx();
    this.rewind = {
      minTicks: 0,
      maxTicks: 0,
    };
    setInterval(() => {
      if (this.extRamUpdated) {
        this.updateExtRam();
        this.extRamUpdated = false;
      }
    }, 1000);
  }

  get paused() { return this.paused_; }
  set paused(newPaused) {
    let oldPaused = this.paused_;
    this.paused_ = newPaused;
    if (!emulator) return;
    if (newPaused == oldPaused) return;
    if (newPaused) {
      emulator.pause();
      this.ticks = emulator.ticks;
      this.rewind.minTicks = emulator.rewind.oldestTicks;
      this.rewind.maxTicks = emulator.rewind.newestTicks;
    } else {
      emulator.resume();
    }
  }

  togglePause() {
    this.paused = !this.paused;
  }

  toggleMute() {
    this.muted = !this.muted;
  }

  updateExtRam() {
    if (!emulator) return;
    const extram = emulator.getExtRam();
    localStorage.setItem(
        extRamKey(currentRomFilename), JSON.stringify(Array.from(extram)));
  }
};

const vm = new VM();

function extRamKey(romFilename) { return `extram:${romFilename}`; }
function saveStateKey(romFilename) { return `saveState:${romFilename}`; }

// ---------------------------------------------------------------------- //
// Color / palette picker. Reachable from the splash screen (before a     //
// game is even loaded) *and* from the in-game menu, so switching to the  //
// authentic Game Boy green (or any other palette) works in both places. //
// ---------------------------------------------------------------------- //

function setPalette(idx) {
  vm.palIdx = ((idx % PALETTES.length) + PALETTES.length) % PALETTES.length;
  localStorage.setItem(PALETTE_STORAGE_KEY, String(vm.palIdx));
  if (emulator) emulator.setBuiltinPalette(vm.palIdx);
  renderColorOptions();
}

function cyclePalette(delta) {
  setPalette(vm.palIdx + delta);
}

// Display order for the Colors dialog: pinned palettes (original Game Boy
// green, then Game Boy Color's default) first -- in that order, if present
// in PALETTES -- followed by everything else in their usual order. This
// only affects how the dialog lists them; it doesn't change what a given
// index means (storage, keyboard [ / ] cycling, etc. are untouched).
function getColorDisplayOrder() {
  const pinned = [];
  for (const paletteId of PINNED_PALETTE_IDS) {
    const idx = PALETTES.indexOf(paletteId);
    if (idx !== -1 && !pinned.includes(idx)) pinned.push(idx);
  }
  const rest = PALETTES.map((_, idx) => idx).filter(idx => !pinned.includes(idx));
  return [...pinned, ...rest];
}

function renderColorOptions() {
  colorOptionsEl.textContent = '';
  for (const idx of getColorDisplayOrder()) {
    const paletteId = PALETTES[idx];
    const btn = document.createElement('button');
    btn.className = 'colorOption';
    btn.classList.toggle('active', idx === vm.palIdx);
    btn.dataset.idx = String(idx);

    const swatch = document.createElement('span');
    swatch.className = 'colorOption-swatch';
    for (const color of PALETTE_INFO[paletteId].swatch) {
      const chip = document.createElement('span');
      chip.style.backgroundColor = color;
      swatch.appendChild(chip);
    }
    btn.appendChild(swatch);

    const name = document.createElement('span');
    name.className = 'colorOption-name';
    name.textContent = t(`palette_name_${paletteId}`);
    btn.appendChild(name);

    colorOptionsEl.appendChild(btn);
  }
}

function openColorsDialog() {
  renderColorOptions();
  colorsDialogEl.hidden = false;
}

function closeColorsDialog() {
  colorsDialogEl.hidden = true;
}

function bindColorsDialog() {
  colorOptionsEl.addEventListener('click', (event) => {
    const btn = event.target.closest('.colorOption');
    if (btn) setPalette(parseInt(btn.dataset.idx, 10));
  });
  colorsCloseBtnEl.addEventListener('click', closeColorsDialog);
  colorsDialogEl.addEventListener('click', (event) => {
    if (event.target === colorsDialogEl) closeColorsDialog();
  });
}

// ---------------------------------------------------------------------- //
// Splash / game-select screen.                                          //
//                                                                        //
// Lists the .gb/.gbc files found in ROM_DIR by fetching the directory's  //
// autogenerated index page (this is what `python -m http.server` returns //
// for a directory with no index.html) and scraping its <a href> links.   //
// Cover art is matched purely by filename: an image is used for a ROM   //
// only if it sits next to it in ROM_DIR with the *same base name*        //
// (e.g. "tetris.gb" + "tetris.jpg"). No external image fetching.        //
// ---------------------------------------------------------------------- //

const COVER_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp', 'gif'];

function baseName(filename) {
  const idx = filename.lastIndexOf('.');
  return idx === -1 ? filename : filename.slice(0, idx);
}

async function listRomManifestEntries() {
  try {
    const response = await fetch(ROM_DIR + 'index.json');
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data)
        ? data.filter((name) => typeof name === 'string' && !name.includes('/'))
        : [];
  } catch (e) {
    return [];
  }
}

async function listRomDirEntries() {
  const fromManifest = await listRomManifestEntries();
  if (fromManifest.length) return fromManifest;

  let html;
  try {
    const response = await fetch(ROM_DIR);
    if (!response.ok) return [];
    html = await response.text();
  } catch (e) {
    return [];
  }
  const hrefs = [...html.matchAll(/<a\s+href="([^"]+)"/gi)].map(m => m[1]);
  return hrefs.map(href => decodeURIComponent(href)).filter(name => !name.includes('/'));
}

async function listRoms() {
  const entries = await listRomDirEntries();

  const coverByBaseName = new Map();
  for (const name of entries) {
    const ext = name.split('.').pop().toLowerCase();
    if (COVER_EXTENSIONS.includes(ext)) {
      coverByBaseName.set(baseName(name), name);
    }
  }

  const fromFolder = entries
      .filter(name => /\.(gb|gbc)$/i.test(name))
      .map(filename => ({
        filename,
        cover: coverByBaseName.get(baseName(filename)) || null,
      }));
  const seen = new Set(fromFolder.map(rom => rom.filename));
  const uploaded = [...uploadedRomBuffers.keys()]
      .filter(filename => !seen.has(filename))
      .map(filename => ({filename, cover: null}));
  return [...fromFolder, ...uploaded].sort((a, b) =>
    a.filename.localeCompare(b.filename));
}

function prettyRomName(filename) {
  return filename.replace(/\.(gb|gbc)$/i, '').replace(/[_-]+/g, ' ');
}

// Short initials (e.g. "Super Mario Land" -> "SM") shown on the plain
// cartridge placeholder used when a ROM has no matching cover art.
function romInitials(name) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'GB';
  return words.slice(0, 2).map(w => w[0].toUpperCase()).join('');
}

function renderRomList(roms) {
  splashListEl.textContent = '';
  splashEmptyEl.hidden = roms.length > 0;
  roms.forEach(({filename, cover}, i) => {
    const prettyName = prettyRomName(filename);

    const btn = document.createElement('div');
    btn.className = cover ? 'romBtn' : 'romBtn romBtn--nocover';
    btn.dataset.filename = filename;
    btn.style.setProperty('--i', i);
    btn.tabIndex = 0;
    btn.setAttribute('role', 'button');
    btn.setAttribute('aria-label', prettyName);

    if (cover) {
      const img = document.createElement('img');
      img.className = 'romBtn-cover';
      img.src = ROM_DIR + encodeURIComponent(cover);
      img.alt = '';
      img.loading = 'lazy';
      btn.appendChild(img);
    } else {
      const cart = document.createElement('div');
      cart.className = 'romBtn-cart';
      const label = document.createElement('div');
      label.className = 'romBtn-cart-label';
      label.textContent = romInitials(prettyName);
      cart.appendChild(label);
      btn.appendChild(cart);
    }

    const name = document.createElement('div');
    name.className = 'romBtn-name';
    name.textContent = prettyName;

    btn.appendChild(name);
    splashListEl.appendChild(btn);
  });
}

function bindSplash() {
  // touchstart/touchend (rather than click) so button presses feel instant
  // on mobile and don't trigger a ghost-click/scroll on the list.
  const onPress = (event) => {
    const btn = event.target.closest('.romBtn');
    if (!btn) return;
    event.preventDefault();
    btn.classList.add('btnPressed');
  };
  const onRelease = (event) => {
    const btn = event.target.closest('.romBtn');
    if (!btn) return;
    event.preventDefault();
    btn.classList.remove('btnPressed');
    loadRom(btn.dataset.filename);
  };
  splashListEl.addEventListener('touchstart', onPress, {passive: false});
  splashListEl.addEventListener('touchend', onRelease, {passive: false});
  splashListEl.addEventListener('click', (event) => {
    const btn = event.target.closest('.romBtn');
    if (btn) loadRom(btn.dataset.filename);
  });
  // Keyboard support (Enter/Space), since each cartridge card is now
  // focusable (tabindex + role="button") for accessibility.
  splashListEl.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const btn = event.target.closest('.romBtn');
    if (!btn) return;
    event.preventDefault();
    loadRom(btn.dataset.filename);
  });
}

function showSplash() {
  Emulator.stop();
  closeGameMenu();
  menuBtnEl.hidden = true;
  gameHeaderEl.hidden = true;
  splashEl.classList.remove('hidden');
  listRoms().then(renderRomList);
}

function hideSplash() {
  closeSplashMenu();
  splashEl.classList.add('hidden');
  menuBtnEl.hidden = false;
  gameHeaderEl.hidden = false;
  updatePauseUI();
  updateMuteUI();
}

// ---------------------------------------------------------------------- //
// Splash-screen burger menu: same idea (and same look) as the in-game    //
// one below, but reachable *before* any ROM is loaded -- this is where   //
// the color/palette options live, so players can set up e.g. the        //
// original Game Boy green before ever starting a game.                  //
// ---------------------------------------------------------------------- //

function openSplashMenu() {
  splashMenuEl.hidden = false;
}

function closeSplashMenu() {
  splashMenuEl.hidden = true;
}

function toggleSplashMenu() {
  if (splashMenuEl.hidden) {
    openSplashMenu();
  } else {
    closeSplashMenu();
  }
}

const splashMenuActions = {
  colors() {
    closeSplashMenu();
    openColorsDialog();
  },
  language() {
    closeSplashMenu();
    openLanguageDialog();
  },
  help() {
    closeSplashMenu();
    openHelpDialog();
  },
};

function bindSplashMenu() {
  const onMenuBtn = (event) => {
    event.preventDefault();
    toggleSplashMenu();
  };
  splashMenuBtnEl.addEventListener('click', onMenuBtn);
  splashMenuBtnEl.addEventListener('touchend', onMenuBtn, {passive: false});

  const onItem = (event) => {
    const btn = event.target.closest('.gameMenuItem');
    if (!btn) return;
    event.preventDefault();
    const action = splashMenuActions[btn.dataset.action];
    if (action) action();
  };
  splashMenuEl.addEventListener('click', onItem);
  splashMenuEl.addEventListener('touchend', onItem, {passive: false});

  // Tap/click anywhere outside the menu (and outside the burger button
  // itself) closes it, same behavior as the in-game menu.
  const onOutside = (event) => {
    if (splashMenuEl.hidden) return;
    if (splashMenuEl.contains(event.target) || event.target === splashMenuBtnEl) {
      return;
    }
    closeSplashMenu();
  };
  document.addEventListener('click', onOutside);
  document.addEventListener('touchend', onOutside);
}

// ---------------------------------------------------------------------- //
// In-game burger menu: pause, save/load state, reset, back to selection. //
// ---------------------------------------------------------------------- //

function openGameMenu() {
  // Exporting only makes sense for games that actually use cartridge RAM
  // (battery saves); grey the button out otherwise instead of hiding it, so
  // the menu layout stays stable across games.
  menuExportSaveBtnEl.disabled = !emulator || emulator.getExtRam().byteLength === 0;
  gameMenuEl.hidden = false;
}

function closeGameMenu() {
  gameMenuEl.hidden = true;
}

function toggleGameMenu() {
  if (gameMenuEl.hidden) {
    openGameMenu();
  } else {
    closeGameMenu();
  }
}

function showToast(text) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = text;
  document.getElementById('game').appendChild(toast);
  setTimeout(() => toast.remove(), 1500);
}

const gameMenuActions = {
  colors() {
    closeGameMenu();
    openColorsDialog();
  },
  pause() {
    vm.togglePause();
    updatePauseUI();
  },
  mute() {
    vm.toggleMute();
    updateMuteUI();
  },
  save() {
    if (!emulator) return;
    emulator.saveState();
    showToast(t('toast_saved'));
    closeGameMenu();
  },
  load() {
    if (!emulator) return;
    emulator.loadState();
    showToast(t('toast_loaded'));
    closeGameMenu();
  },
  exportSave() {
    closeGameMenu();
    if (!emulator || !currentRomFilename) return;
    const extram = emulator.getExtRam();
    if (extram.byteLength === 0) {
      showToast(t('toast_no_save_data'));
      return;
    }
    const blob = new Blob([extram], {type: 'application/octet-stream'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = baseName(currentRomFilename) + '.sav';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast(t('toast_save_exported'));
  },
  importSave() {
    closeGameMenu();
    if (!emulator) return;
    importSaveInputEl.click();
  },
  reset() {
    if (!currentRomFilename) return;
    closeGameMenu();
    loadRom(currentRomFilename);
  },
  language() {
    closeGameMenu();
    openLanguageDialog();
  },
  help() {
    closeGameMenu();
    openHelpDialog();
  },
  quit() {
    showSplash();
  },
};

function bindGameMenu() {
  const onMenuBtn = (event) => {
    event.preventDefault();
    toggleGameMenu();
  };
  menuBtnEl.addEventListener('click', onMenuBtn);
  menuBtnEl.addEventListener('touchend', onMenuBtn, {passive: false});

  const onItem = (event) => {
    const btn = event.target.closest('.gameMenuItem');
    if (!btn || btn.disabled) return;
    event.preventDefault();
    const action = gameMenuActions[btn.dataset.action];
    if (action) action();
  };
  gameMenuEl.addEventListener('click', onItem);
  gameMenuEl.addEventListener('touchend', onItem, {passive: false});

  importSaveInputEl.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    event.target.value = ''; // allow re-selecting the same file next time
    if (!file || !emulator || !currentRomFilename) return;
    const buffer = new Uint8Array(await file.arrayBuffer());
    const expectedSize = emulator.getExtRam().byteLength;
    if (expectedSize === 0 || buffer.byteLength !== expectedSize) {
      showToast(t('toast_import_failed'));
      return;
    }
    emulator.loadExtRam(buffer);
    localStorage.setItem(
        extRamKey(currentRomFilename), JSON.stringify(Array.from(buffer)));
    showToast(t('toast_save_imported'));
  });

  // Tap/click anywhere outside the menu (and outside the burger button
  // itself, which has its own toggle handler) closes it.
  const onOutside = (event) => {
    if (gameMenuEl.hidden) return;
    if (gameMenuEl.contains(event.target) || event.target === menuBtnEl) {
      return;
    }
    closeGameMenu();
  };
  document.addEventListener('click', onOutside);
  document.addEventListener('touchend', onOutside);
}

// Always-visible header icon bar (top-left, same row as the burger button):
// quick access to the most common actions without opening the full menu.
// Reuses the very same gameMenuActions handlers as the burger menu.
function bindGameHeader() {
  const onItem = (event) => {
    const btn = event.target.closest('.headerIconBtn');
    if (!btn || btn.disabled) return;
    event.preventDefault();
    const action = gameMenuActions[btn.dataset.action];
    if (action) action();
  };
  gameHeaderEl.addEventListener('click', onItem);
  gameHeaderEl.addEventListener('touchend', onItem, {passive: false});
}

// ---------------------------------------------------------------------- //
// Keyboard-commands help dialog (reachable from the splash screen and    //
// from the in-game menu, so PC players can look up the keys any time).   //
// ---------------------------------------------------------------------- //

function renderHelpTable() {
  helpTableEl.textContent = '';
  for (const {keys, action} of getKeyHelp()) {
    const row = document.createElement('tr');
    const keysCell = document.createElement('td');
    keysCell.textContent = keys;
    const actionCell = document.createElement('td');
    actionCell.textContent = action;
    row.appendChild(keysCell);
    row.appendChild(actionCell);
    helpTableEl.appendChild(row);
  }
}

function openHelpDialog() {
  helpDialogEl.hidden = false;
}

function closeHelpDialog() {
  helpDialogEl.hidden = true;
}

function bindHelpDialog() {
  splashHelpLinkEl.addEventListener('click', openHelpDialog);
  helpCloseBtnEl.addEventListener('click', closeHelpDialog);
  helpDialogEl.addEventListener('click', (event) => {
    if (event.target === helpDialogEl) closeHelpDialog();
  });
}

// ---------------------------------------------------------------------- //
// Language picker dialog (English/French for now, see STRINGS above).    //
// ---------------------------------------------------------------------- //

function openLanguageDialog() {
  languageDialogEl.hidden = false;
}

function closeLanguageDialog() {
  languageDialogEl.hidden = true;
}

function bindLanguageDialog() {
  splashLanguageLinkEl.addEventListener('click', openLanguageDialog);
  languageCloseBtnEl.addEventListener('click', closeLanguageDialog);
  languageDialogEl.addEventListener('click', (event) => {
    if (event.target === languageDialogEl) {
      closeLanguageDialog();
      return;
    }
    const btn = event.target.closest('.langOption');
    if (btn) {
      setLanguage(btn.dataset.lang);
      closeLanguageDialog();
    }
  });
}

async function loadRomBuffer(filename) {
  if (uploadedRomBuffers.has(filename)) {
    return uploadedRomBuffers.get(filename);
  }
  const response = await fetch(ROM_DIR + encodeURIComponent(filename));
  return response.arrayBuffer();
}

async function loadRom(filename) {
  closeGameMenu();
  currentRomFilename = filename;
  const romBuffer = await loadRomBuffer(filename);
  let extRam = new Uint8Array();
  try {
    extRam =
        new Uint8Array(JSON.parse(localStorage.getItem(extRamKey(filename))));
  } catch (e) {
    // No save data for this ROM yet.
  }
  Emulator.start(await binjgbPromise, romBuffer, extRam);
  emulator.setBuiltinPalette(vm.palIdx);
  hideSplash();
}

async function addOpenedRomFiles(fileList) {
  for (const file of fileList) {
    if (!/\.(gb|gbc)$/i.test(file.name)) continue;
    uploadedRomBuffers.set(file.name, await file.arrayBuffer());
  }
  renderRomList(await listRoms());
}

function bindOpenRom() {
  openRomBtnEl.addEventListener('click', () => openRomInputEl.click());
  openRomInputEl.addEventListener('change', async () => {
    await addOpenedRomFiles(openRomInputEl.files);
    openRomInputEl.value = '';
  });
}

(async function go() {
  bindSplash();
  bindOpenRom();
  bindSplashMenu();
  bindGameMenu();
  bindGameHeader();
  bindHelpDialog();
  bindLanguageDialog();
  bindColorsDialog();
  applyI18n();
  // List the ROM folder right away; don't wait on the (possibly slower)
  // Wasm module load, which only matters once a game is actually picked.
  renderRomList(await listRoms());
})();


// Copied from demo.js
function makeWasmBuffer(module, ptr, size) {
  return new Uint8Array(module.HEAP8.buffer, ptr, size);
}

class Emulator {
  static start(module, romBuffer, extRamBuffer) {
    Emulator.stop();
    emulator = new Emulator(module, romBuffer, extRamBuffer);
    emulator.run();
  }

  static stop() {
    if (emulator) {
      emulator.destroy();
      emulator = null;
    }
  }

  constructor(module, romBuffer, extRamBuffer) {
    this.module = module;
    // Align size up to 32k.
    const size = (romBuffer.byteLength + 0x7fff) & ~0x7fff;
    this.romDataPtr = this.module._malloc(size);
    makeWasmBuffer(this.module, this.romDataPtr, size)
        .fill(0)
        .set(new Uint8Array(romBuffer));
    this.e = this.module._emulator_new_simple(
        this.romDataPtr, size, Audio.ctx.sampleRate, AUDIO_FRAMES,
        CGB_COLOR_CURVE);
    if (this.e == 0) {
      throw new Error('Invalid ROM.');
    }

    this.audio = new Audio(module, this.e);
    this.video = new Video(module, this.e, $('canvas'));
    this.rewind = new Rewind(module, this.e);
    this.rewindIntervalId = 0;

    this.lastRafSec = 0;
    this.leftoverTicks = 0;
    this.fps = 60;
    this.fastForward = false;

    if (extRamBuffer && extRamBuffer.byteLength > 0) {
      this.loadExtRam(extRamBuffer);
    }

    this.bindKeys();
    this.bindTouch();
  }

  destroy() {
    this.unbindTouch();
    this.unbindKeys();
    this.cancelAnimationFrame();
    clearInterval(this.rewindIntervalId);
    this.rewind.destroy();
    this.audio.destroy();
    this.module._emulator_delete(this.e);
    this.module._free(this.romDataPtr);
  }

  withNewFileData(fileDataPtr, cb) {
    const buffer = makeWasmBuffer(
        this.module, this.module._get_file_data_ptr(fileDataPtr),
        this.module._get_file_data_size(fileDataPtr));
    const result = cb(fileDataPtr, buffer);
    // _file_data_delete() only frees the inner FileData.data buffer; the
    // FileData struct itself (allocated by _state_file_data_new() /
    // _ext_ram_file_data_new()) is a separate malloc that must be freed
    // here too, otherwise every single save/load/getExtRam call leaks it
    // (this used to be called rarely enough to go unnoticed, but the menu
    // now calls getExtRam() on every open, and gameplay auto-saves ext RAM
    // every second -- without this, the Wasm heap eventually runs out and
    // a later malloc failure crashes with "memory access out of bounds").
    this.module._file_data_delete(fileDataPtr);
    this.module._free(fileDataPtr);
    return result;
  }

  withNewExtRamFileData(cb) {
    return this.withNewFileData(this.module._ext_ram_file_data_new(this.e), cb);
  }

  withNewStateFileData(cb) {
    return this.withNewFileData(this.module._state_file_data_new(this.e), cb);
  }

  loadExtRam(extRamBuffer) {
    this.withNewExtRamFileData((fileDataPtr, buffer) => {
      if (buffer.byteLength === extRamBuffer.byteLength) {
        buffer.set(new Uint8Array(extRamBuffer));
        this.module._emulator_read_ext_ram(this.e, fileDataPtr);
      }
    });
  }

  getExtRam() {
    return this.withNewExtRamFileData((fileDataPtr, buffer) => {
      this.module._emulator_write_ext_ram(this.e, fileDataPtr);
      return new Uint8Array(buffer);
    });
  }

  loadState() {
    const saveStateBuffer = new Uint8Array(
        JSON.parse(localStorage.getItem(saveStateKey(currentRomFilename))));
    this.withNewStateFileData((fileDataPtr, buffer) => {
      if (buffer.byteLength === saveStateBuffer.byteLength) {
        buffer.set(new Uint8Array(saveStateBuffer));
        this.module._emulator_read_state(this.e, fileDataPtr);
      }
    });
  }

  saveState() {
    const saveStateBuffer = this.withNewStateFileData((fileDataPtr, buffer) => {
      this.module._emulator_write_state(this.e, fileDataPtr);
      return new Uint8Array(buffer);
    });
    localStorage.setItem(
        saveStateKey(currentRomFilename),
        JSON.stringify(Array.from(saveStateBuffer)));
  }

  get isPaused() {
    return this.rafCancelToken === null;
  }

  pause() {
    if (!this.isPaused) {
      this.cancelAnimationFrame();
      this.audio.pause();
      this.beginRewind();
    }
  }

  resume() {
    if (this.isPaused) {
      this.endRewind();
      this.requestAnimationFrame();
      this.audio.resume();
    }
  }

  setBuiltinPalette(palIdx) {
    this.module._emulator_set_builtin_palette(this.e, PALETTES[palIdx]);
  }

  get isRewinding() {
    return ENABLE_REWIND && this.rewind.isRewinding;
  }

  beginRewind() {
    if (!ENABLE_REWIND) { return; }
    this.rewind.beginRewind();
  }

  rewindToTicks(ticks) {
    if (!ENABLE_REWIND) { return; }
    if (this.rewind.rewindToTicks(ticks)) {
      this.runUntil(ticks);
      this.video.renderTexture();
    }
  }

  endRewind() {
    if (!ENABLE_REWIND) { return; }
    this.rewind.endRewind();
    this.lastRafSec = 0;
    this.leftoverTicks = 0;
    this.audio.startSec = 0;
  }

  set autoRewind(enabled) {
    if (!ENABLE_REWIND) { return; }
    if (enabled) {
      this.rewindIntervalId = setInterval(() => {
        const oldest = this.rewind.oldestTicks;
        const start = this.ticks;
        const delta =
            REWIND_FACTOR * REWIND_UPDATE_MS / 1000 * CPU_TICKS_PER_SECOND;
        const rewindTo = Math.max(oldest, start - delta);
        this.rewindToTicks(rewindTo);
        vm.ticks = emulator.ticks;
      }, REWIND_UPDATE_MS);
    } else {
      clearInterval(this.rewindIntervalId);
      this.rewindIntervalId = 0;
    }
  }

  requestAnimationFrame() {
    this.rafCancelToken = requestAnimationFrame(this.rafCallback.bind(this));
  }

  cancelAnimationFrame() {
    cancelAnimationFrame(this.rafCancelToken);
    this.rafCancelToken = null;
  }

  run() {
    this.requestAnimationFrame();
  }

  get ticks() {
    return this.module._emulator_get_ticks_f64(this.e);
  }

  runUntil(ticks) {
    while (true) {
      const event = this.module._emulator_run_until_f64(this.e, ticks);
      if (event & EVENT_NEW_FRAME) {
        this.rewind.pushBuffer();
        this.video.uploadTexture();
      }
      if ((event & EVENT_AUDIO_BUFFER_FULL) && !this.isRewinding) {
        this.audio.pushBuffer();
      }
      if (event & EVENT_UNTIL_TICKS) {
        break;
      }
    }
    if (this.module._emulator_was_ext_ram_updated(this.e)) {
      vm.extRamUpdated = true;
    }
  }

  rafCallback(startMs) {
    this.requestAnimationFrame();
    let deltaSec = 0;
    if (!this.isRewinding) {
      const startSec = startMs / 1000;
      deltaSec = Math.max(startSec - (this.lastRafSec || startSec), 0);

      const startTimeMs = performance.now();
      const deltaTicks =
          Math.min(deltaSec, MAX_UPDATE_SEC) * CPU_TICKS_PER_SECOND;
      let runUntilTicks = this.ticks + deltaTicks - this.leftoverTicks;
      this.runUntil(runUntilTicks);
      const deltaTimeMs = performance.now() - startTimeMs;
      const deltaTimeSec = deltaTimeMs / 1000;

      if (this.fastForward) {
        // Estimate how much faster we can run in fast-forward, keeping the
        // same rAF update rate.
        const speedUp = (deltaTicks / CPU_TICKS_PER_SECOND) / deltaTimeSec;
        const extraFrames = Math.floor(speedUp - deltaTimeSec);
        const extraTicks = extraFrames * deltaTicks;
        runUntilTicks = this.ticks + extraTicks - this.leftoverTicks;
        this.runUntil(runUntilTicks);
      }

      this.leftoverTicks = (this.ticks - runUntilTicks) | 0;
      this.lastRafSec = startSec;
    }
    const lerp = (from, to, alpha) => (alpha * from) + (1 - alpha) * to;
    this.fps = lerp(this.fps, Math.min(1 / deltaSec, 10000), 0.3);
    this.video.renderTexture();
  }

  // PHASE 2: touch (+ mouse) binding.
  //
  // Each virtual button (the 4 D-Pad arms + B/A/Start/Select) is its own DOM
  // element with its own touchstart/touchend/touchcancel listeners, and
  // tracks the set of *touch identifiers* currently pressing it. That means:
  //  - Two buttons pressed at once (e.g. a D-Pad direction + A, or A+B) are
  //    completely independent: each one calls its own
  //    `module._set_joyp_*()` exactly once on press/release, so neither can
  //    block or clobber the other's state.
  //  - A diagonal on the D-Pad can be pressed either as two of its arms
  //    (e.g. Up and Left) held by two different fingers, or as a single
  //    dedicated diagonal corner button (controller_ul/ur/dl/dr) whose
  //    setter just flips both underlying directions at once -- either way
  //    the two directions stay set independently and simultaneously.
  //  - Multiple fingers landing on/leaving the *same* button (rare, but
  //    possible with fat fingers) are coalesced via the identifier Set, so
  //    the button only releases once every touch on it has ended.
  // preventDefault() on every touch event kills the 300ms ghost-click delay,
  // text-selection callouts, and page scroll/zoom triggered by the pad.
  //
  // Desktop/PC support: mousedown/mouseup/mouseleave are wired on the same
  // elements so the pad is clickable with a mouse too. A synthetic
  // MOUSE_POINTER_ID is added to/removed from the very same activeTouchIds
  // Set used for real touches, so mouse presses go through the exact same
  // "only fire on first press / only release on last release" logic -- no
  // separate code path, no risk of the mouse and touch paths disagreeing.
  bindTouch() {
    // Combines two direction setters into one, so a single diagonal corner
    // button (e.g. up-right) presses/releases both directions together.
    const diagonal = (setterA, setterB) => (pressed) => {
      setterA(pressed);
      setterB(pressed);
    };

    this.touchTargets = [
      {el: dpadUpEl, setter: this.setJoypUp.bind(this)},
      {el: dpadDownEl, setter: this.setJoypDown.bind(this)},
      {el: dpadLeftEl, setter: this.setJoypLeft.bind(this)},
      {el: dpadRightEl, setter: this.setJoypRight.bind(this)},
      {
        el: dpadUlEl,
        setter: diagonal(this.setJoypUp.bind(this), this.setJoypLeft.bind(this)),
      },
      {
        el: dpadUrEl,
        setter: diagonal(this.setJoypUp.bind(this), this.setJoypRight.bind(this)),
      },
      {
        el: dpadDlEl,
        setter: diagonal(this.setJoypDown.bind(this), this.setJoypLeft.bind(this)),
      },
      {
        el: dpadDrEl,
        setter: diagonal(this.setJoypDown.bind(this), this.setJoypRight.bind(this)),
      },
      {el: bEl, setter: this.setJoypB.bind(this)},
      {el: aEl, setter: this.setJoypA.bind(this)},
      {el: startEl, setter: this.setJoypStart.bind(this)},
      {el: selectEl, setter: this.setJoypSelect.bind(this)},
    ];
    for (const target of this.touchTargets) {
      target.activeTouchIds = new Set();
    }

    this.boundHandleTouchStart = this.handleTouchStart.bind(this);
    this.boundHandleTouchEnd = this.handleTouchEnd.bind(this);
    this.boundHandleMouseDown = this.handleMouseDown.bind(this);
    this.boundHandleMouseUp = this.handleMouseUp.bind(this);

    for (const target of this.touchTargets) {
      target.el.addEventListener(
          'touchstart', this.boundHandleTouchStart, {passive: false});
      target.el.addEventListener(
          'touchend', this.boundHandleTouchEnd, {passive: false});
      target.el.addEventListener(
          'touchcancel', this.boundHandleTouchEnd, {passive: false});
      target.el.addEventListener('mousedown', this.boundHandleMouseDown);
      target.el.addEventListener('mouseup', this.boundHandleMouseUp);
      // Leaving the button releases it too: with a plain mouse (no pointer
      // capture) there's no reliable way to keep tracking the button once
      // the cursor has left it, so treat "moved off" like "let go".
      target.el.addEventListener('mouseleave', this.boundHandleMouseUp);
    }
  }

  unbindTouch() {
    for (const target of this.touchTargets) {
      target.el.removeEventListener('touchstart', this.boundHandleTouchStart);
      target.el.removeEventListener('touchend', this.boundHandleTouchEnd);
      target.el.removeEventListener('touchcancel', this.boundHandleTouchEnd);
      target.el.removeEventListener('mousedown', this.boundHandleMouseDown);
      target.el.removeEventListener('mouseup', this.boundHandleMouseUp);
      target.el.removeEventListener('mouseleave', this.boundHandleMouseUp);
    }
  }

  findTouchTarget(el) {
    return this.touchTargets.find(target => target.el === el);
  }

  handleTouchStart(event) {
    const target = this.findTouchTarget(event.currentTarget);
    if (!target) return;
    event.preventDefault();

    const wasPressed = target.activeTouchIds.size > 0;
    for (const touch of event.changedTouches) {
      target.activeTouchIds.add(touch.identifier);
    }
    // Only fire the Wasm call on the *first* touch to land on this button;
    // extra fingers on the same button are just tracked, not re-fired.
    if (!wasPressed && target.activeTouchIds.size > 0) {
      target.setter(true);
      target.el.classList.add('btnPressed');
    }
  }

  handleTouchEnd(event) {
    const target = this.findTouchTarget(event.currentTarget);
    if (!target) return;
    event.preventDefault();

    for (const touch of event.changedTouches) {
      target.activeTouchIds.delete(touch.identifier);
    }
    // Only release once *every* finger has left this button.
    if (target.activeTouchIds.size === 0) {
      target.setter(false);
      target.el.classList.remove('btnPressed');
    }
  }

  handleMouseDown(event) {
    if (event.button !== 0) return; // left click only
    const target = this.findTouchTarget(event.currentTarget);
    if (!target) return;
    event.preventDefault();

    const wasPressed = target.activeTouchIds.size > 0;
    target.activeTouchIds.add(MOUSE_POINTER_ID);
    if (!wasPressed) {
      target.setter(true);
      target.el.classList.add('btnPressed');
    }
  }

  handleMouseUp(event) {
    const target = this.findTouchTarget(event.currentTarget);
    if (!target || !target.activeTouchIds.has(MOUSE_POINTER_ID)) return;

    target.activeTouchIds.delete(MOUSE_POINTER_ID);
    if (target.activeTouchIds.size === 0) {
      target.setter(false);
      target.el.classList.remove('btnPressed');
    }
  }

  bindKeys() {
    this.keyFuncs = {
      'ArrowDown': this.setJoypDown.bind(this),
      'ArrowLeft': this.setJoypLeft.bind(this),
      'ArrowRight': this.setJoypRight.bind(this),
      'ArrowUp': this.setJoypUp.bind(this),
      'KeyZ': this.setJoypB.bind(this),
      'KeyX': this.setJoypA.bind(this),
      'Enter': this.setJoypStart.bind(this),
      'Tab': this.setJoypSelect.bind(this),
      'Backspace': this.keyRewind.bind(this),
      'Space': this.keyPause.bind(this),
      'BracketLeft': this.keyPrevPalette.bind(this),
      'BracketRight': this.keyNextPalette.bind(this),
      'ShiftLeft': this.setFastForward.bind(this),
      'F6': this.saveState.bind(this),
      'F9': this.loadState.bind(this),
    };
    this.boundKeyDown = this.keyDown.bind(this);
    this.boundKeyUp = this.keyUp.bind(this);

    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keyup', this.boundKeyUp);
  }

  unbindKeys() {
    window.removeEventListener('keydown', this.boundKeyDown);
    window.removeEventListener('keyup', this.boundKeyUp);
  }

  keyDown(event) {
    if (event.code in this.keyFuncs) {
      this.keyFuncs[event.code](true);
      event.preventDefault();
    }
  }

  keyUp(event) {
    if (event.code in this.keyFuncs) {
      this.keyFuncs[event.code](false);
      event.preventDefault();
    }
  }

  keyRewind(isKeyDown) {
    if (!ENABLE_REWIND) { return; }
    if (this.isRewinding !== isKeyDown) {
      if (isKeyDown) {
        vm.paused = true;
        this.autoRewind = true;
      } else {
        this.autoRewind = false;
        vm.paused = false;
      }
    }
  }

  keyPause(isKeyDown) {
    if (!ENABLE_PAUSE) { return; }
    if (isKeyDown) {
      vm.togglePause();
      updatePauseUI();
    }
  }

  keyPrevPalette(isKeyDown) {
    if (!ENABLE_SWITCH_PALETTES) { return; }
    if (isKeyDown) cyclePalette(-1);
  }

  keyNextPalette(isKeyDown) {
    if (!ENABLE_SWITCH_PALETTES) { return; }
    if (isKeyDown) cyclePalette(1);
  }

  setFastForward(isKeyDown) {
    if (!ENABLE_FAST_FORWARD) { return; }
    this.fastForward = isKeyDown;
  }

  setJoypDown(set) { this.module._set_joyp_down(this.e, set); }
  setJoypUp(set) { this.module._set_joyp_up(this.e, set); }
  setJoypLeft(set) { this.module._set_joyp_left(this.e, set); }
  setJoypRight(set) { this.module._set_joyp_right(this.e, set); }
  setJoypSelect(set) { this.module._set_joyp_select(this.e, set); }
  setJoypStart(set) { this.module._set_joyp_start(this.e, set); }
  setJoypB(set) { this.module._set_joyp_B(this.e, set); }
  setJoypA(set) { this.module._set_joyp_A(this.e, set); }
}

class Audio {
  constructor(module, e) {
    this.started = false;
    this.module = module;
    this.buffer = makeWasmBuffer(
        this.module, this.module._get_audio_buffer_ptr(e),
        this.module._get_audio_buffer_capacity(e));
    this.startSec = 0;
    this.resume();

    this.boundStartPlayback = this.startPlayback.bind(this);
    window.addEventListener('keydown', this.boundStartPlayback, true);
    window.addEventListener('click', this.boundStartPlayback, true);
    window.addEventListener('touchend', this.boundStartPlayback, true);
  }

  startPlayback() {
    window.removeEventListener('touchend', this.boundStartPlayback, true);
    window.removeEventListener('keydown', this.boundStartPlayback, true);
    window.removeEventListener('click', this.boundStartPlayback, true);
    this.started = true;
    this.resume();
  }

  get sampleRate() { return Audio.ctx.sampleRate; }

  pushBuffer() {
    if (!this.started) { return; }
    const nowSec = Audio.ctx.currentTime;
    const nowPlusLatency = nowSec + AUDIO_LATENCY_SEC;
    const volume = vm.muted ? 0 : vm.volume;
    this.startSec = (this.startSec || nowPlusLatency);
    if (this.startSec >= nowSec) {
      const buffer = Audio.ctx.createBuffer(2, AUDIO_FRAMES, this.sampleRate);
      const channel0 = buffer.getChannelData(0);
      const channel1 = buffer.getChannelData(1);
      for (let i = 0; i < AUDIO_FRAMES; i++) {
        channel0[i] = this.buffer[2 * i] * volume / 255;
        channel1[i] = this.buffer[2 * i + 1] * volume / 255;
      }
      const bufferSource = Audio.ctx.createBufferSource();
      bufferSource.buffer = buffer;
      bufferSource.connect(Audio.ctx.destination);
      bufferSource.start(this.startSec);
      const bufferSec = AUDIO_FRAMES / this.sampleRate;
      this.startSec += bufferSec;
    } else {
      console.log(
          'Resetting audio (' + this.startSec.toFixed(2) + ' < ' +
          nowSec.toFixed(2) + ')');
      this.startSec = nowPlusLatency;
    }
  }

  pause() {
    if (!this.started) { return; }
    Audio.ctx.suspend();
  }

  resume() {
    if (!this.started) { return; }
    Audio.ctx.resume();
  }

  destroy() {
    if (this.boundStartPlayback) {
      window.removeEventListener('keydown',  this.boundStartPlayback, true);
      window.removeEventListener('click',    this.boundStartPlayback, true);
      window.removeEventListener('touchend', this.boundStartPlayback, true);
      this.boundStartPlayback = null;
    }
    this.buffer = null;
    this.started = false;
  }
}

Audio.ctx = new AudioContext;

class Video {
  constructor(module, e, el) {
    this.module = module;
    // iPhone Safari doesn't upscale using image-rendering: pixelated on webgl
    // canvases. See https://bugs.webkit.org/show_bug.cgi?id=193895.
    // For now, default to Canvas2D.
    if (window.navigator.userAgent.match(/iPhone|iPad/)) {
      this.renderer = new Canvas2DRenderer(el);
    } else {
      try {
        this.renderer = new WebGLRenderer(el);
      } catch (error) {
        console.log(`Error creating WebGLRenderer: ${error}`);
        this.renderer = new Canvas2DRenderer(el);
      }
    }
    this.buffer = makeWasmBuffer(
        this.module, this.module._get_frame_buffer_ptr(e),
        this.module._get_frame_buffer_size(e));
  }

  uploadTexture() {
    this.renderer.uploadTexture(this.buffer);
  }

  renderTexture() {
    this.renderer.renderTexture();
  }
}

class Canvas2DRenderer {
  constructor(el) {
    this.ctx = el.getContext('2d');
    this.imageData = this.ctx.createImageData(el.width, el.height);
  }

  renderTexture() {
    this.ctx.putImageData(this.imageData, 0, 0);
  }

  uploadTexture(buffer) {
    this.imageData.data.set(buffer);
  }
}

class WebGLRenderer {
  constructor(el) {
    const gl = this.gl = el.getContext('webgl', {preserveDrawingBuffer: true});
    if (gl === null) {
      throw new Error('unable to create webgl context');
    }

    const w = SCREEN_WIDTH / 256;
    const h = SCREEN_HEIGHT / 256;
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,  0, h,
      +1, -1,  w, h,
      -1, +1,  0, 0,
      +1, +1,  w, 0,
    ]), gl.STATIC_DRAW);

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
        gl.TEXTURE_2D, 0, gl.RGBA, 256, 256, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

    function compileShader(type, source) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error(`compileShader failed: ${gl.getShaderInfoLog(shader)}`);
      }
      return shader;
    }

    const vertexShader = compileShader(gl.VERTEX_SHADER,
       `attribute vec2 aPos;
        attribute vec2 aTexCoord;
        varying highp vec2 vTexCoord;
        void main(void) {
          gl_Position = vec4(aPos, 0.0, 1.0);
          vTexCoord = aTexCoord;
        }`);
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER,
       `varying highp vec2 vTexCoord;
        uniform sampler2D uSampler;
        void main(void) {
          gl_FragColor = texture2D(uSampler, vTexCoord);
        }`);

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(`program link failed: ${gl.getProgramInfoLog(program)}`);
    }
    gl.useProgram(program);

    const aPos = gl.getAttribLocation(program, 'aPos');
    const aTexCoord = gl.getAttribLocation(program, 'aTexCoord');
    const uSampler = gl.getUniformLocation(program, 'uSampler');

    gl.enableVertexAttribArray(aPos);
    gl.enableVertexAttribArray(aTexCoord);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, gl.FALSE, 16, 0);
    gl.vertexAttribPointer(aTexCoord, 2, gl.FLOAT, gl.FALSE, 16, 8);
    gl.uniform1i(uSampler, 0);
  }

  renderTexture() {
    this.gl.clearColor(0.5, 0.5, 0.5, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
  }

  uploadTexture(buffer) {
    this.gl.texSubImage2D(
        this.gl.TEXTURE_2D, 0, 0, 0, SCREEN_WIDTH, SCREEN_HEIGHT, this.gl.RGBA,
        this.gl.UNSIGNED_BYTE, buffer);
  }
}

class Rewind {
  constructor(module, e) {
    this.module = module;
    this.e = e;
    this.joypadBufferPtr = this.module._joypad_new();
    this.statePtr = 0;
    this.bufferPtr = this.module._rewind_new_simple(
        e, REWIND_FRAMES_PER_BASE_STATE, REWIND_BUFFER_CAPACITY);
    this.module._emulator_set_default_joypad_callback(e, this.joypadBufferPtr);
  }

  destroy() {
    this.module._rewind_delete(this.bufferPtr);
    this.module._joypad_delete(this.joypadBufferPtr);
  }

  get oldestTicks() {
    return this.module._rewind_get_oldest_ticks_f64(this.bufferPtr);
  }

  get newestTicks() {
    return this.module._rewind_get_newest_ticks_f64(this.bufferPtr);
  }

  pushBuffer() {
    if (!this.isRewinding) {
      this.module._rewind_append(this.bufferPtr, this.e);
    }
  }

  get isRewinding() {
    return this.statePtr !== 0;
  }

  beginRewind() {
    if (this.isRewinding) return;
    this.statePtr =
        this.module._rewind_begin(this.e, this.bufferPtr, this.joypadBufferPtr);
  }

  rewindToTicks(ticks) {
    if (!this.isRewinding) return;
    return this.module._rewind_to_ticks_wrapper(this.statePtr, ticks) ===
        RESULT_OK;
  }

  endRewind() {
    if (!this.isRewinding) return;
    this.module._emulator_set_default_joypad_callback(
        this.e, this.joypadBufferPtr);
    this.module._rewind_end(this.statePtr);
    this.statePtr = 0;
  }
}
