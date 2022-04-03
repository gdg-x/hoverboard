/* eslint-disable max-len */

import '@polymer/iron-icon';
import '@polymer/iron-iconset-svg/iron-iconset-svg';

const documentContainer = document.createElement('template');

documentContainer.innerHTML = `<iron-iconset-svg name="hoverboard" size="24">
  <svg>
    <defs>
      <g id="menu">
        <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"></path>
      </g>
      <g id="up">
        <path d="M7.41,15.41L12,10.83L16.59,15.41L18,14L12,8L6,14L7.41,15.41Z"></path>
      </g>
      <g id="twitter">
        <path d="M22.46 6c-0.77 0.35-1.6 0.58-2.46 0.69 0.88-0.53 1.56-1.37 1.88-2.38-0.83 0.5-1.75 0.85-2.72 1.050-0.79-0.86-1.9-1.36-3.16-1.36-2.35 0-4.27 1.92-4.27 4.29 0 0.34 0.040 0.67 0.11 0.98-3.56-0.18-6.73-1.89-8.84-4.48-0.37 0.63-0.58 1.37-0.58 2.15 0 1.49 0.75 2.81 1.91 3.56-0.71 0-1.37-0.2-1.95-0.5 0 0 0 0 0 0.030 0 2.080 1.48 3.82 3.44 4.21-0.36 0.1-0.74 0.15-1.13 0.15-0.27 0-0.54-0.030-0.8-0.080 0.54 1.69 2.11 2.95 4 2.98-1.46 1.16-3.31 1.84-5.33 1.84-0.34 0-0.68-0.020-1.020-0.060 1.9 1.22 4.16 1.93 6.58 1.93 7.88 0 12.21-6.54 12.21-12.21 0-0.19 0-0.37-0.010-0.56 0.84-0.6 1.56-1.36 2.14-2.23z"></path>
      </g>
      <g id="facebook">
        <path d="M17 2v0 0 4h-2c-0.69 0-1 0.81-1 1.5v2.5h3v4h-3v8h-4v-8h-3v-4h3v-4c0-2.209 1.791-4 4-4v0h3z"></path>
      </g>
      <g id="meetup">
        <path d="m 4,6 c -1.4713,3.52 -2.6119,6.9499 -3.4326,10.3891 -0.6741,2.8242 0.282,4.6616 2.1328,4.8754 2.6564,0.3069 3.6592,-0.0306 4.4776,-3.3377 0.5947,-2.4034 1.9734,-5.3093 3.0861,-8.1183 0.5412,-1.3666 2.3921,-1.2307 2.2076,0.3661 -0.2044,1.7697 -1.2694,3.8233 -2.2284,6.3715 -1.1062,2.9391 1.5367,3.3574 2.8769,1.6738 1.2998,-1.6329 1.949,-3.7492 3.0337,-6.0153 0.6208,-1.2967 1.1673,-2.5386 1.9877,-3.7354 0.7688,-1.1214 2.323,-0.2821 1.7784,1.0462 -1.0899,2.6581 -3.5704,5.3922 -3.5568,8.8614 0.0107,2.7305 2.6638,4.3947 5.9629,4.1845 2.3381,-0.1489 2.1713,-2.4644 0.4708,-2.6676 -2.3276,-0.2781 -3.1192,-0.6202 -2.7515,-2.9815 0.3975,-2.5529 3.1221,-6.0126 3.693,-9.729 0.3841,-2.5009 -1.5023,-3.908 -4.2892,-3.2242 -1.4452,0.3547 -1.4931,0.5081 -2.4061,-0.2803 -1.5814,-1.3657 -2.8253,-0.8243 -4.2891,0.6799 -0.5434,0.5585 -1.4877,0.4424 -2.6153,-0.2092 -2.6742,-1.5457 -5.0561,-0.7392 -6.1385,1.8506 z"></path>
      </g>
      <g id="google" fill="none">
        <path fill="#4285f4" style="fill: #4285f4" d="M20.269 12.191c0-0.599-0.054-1.174-0.154-1.726h-7.946v3.264h4.541c-0.195 1.055-0.79 1.949-1.684 2.546v2.118h2.726c1.595-1.469 2.516-3.632 2.516-6.201v0z"></path>
        <path fill="#34a853" style="fill: #34a853" d="M12.169 20.438c2.277 0 4.187-0.755 5.584-2.044l-2.726-2.118c-0.755 0.506-1.722 0.805-2.857 0.805-2.198 0-4.057-1.484-4.721-3.479h-2.819v2.186c1.389 2.758 4.241 4.649 7.54 4.649v0z"></path>
        <path fill="#fbbc05" style="fill: #fbbc05" d="M7.448 13.604c-0.169-0.506-0.265-1.047-0.265-1.604s0.096-1.096 0.265-1.604v-2.186h-2.819c-0.571 1.139-0.898 2.428-0.898 3.789s0.326 2.65 0.898 3.789l2.819-2.186z"></path>
        <path fill="#ea4335" style="fill: #ea4335" d="M12.169 6.919c1.239 0 2.351 0.426 3.225 1.261l2.42-2.42c-1.461-1.361-3.371-2.198-5.645-2.198-3.299 0-6.151 1.891-7.54 4.649l2.819 2.186c0.664-1.994 2.524-3.479 4.721-3.479v0z"></path>
      </g>
      <g id="linkedin">
        <path d="M21,21H17V14.25C17,13.19 15.81,12.31 14.75,12.31C13.69,12.31 13,13.19 13,14.25V21H9V9H13V11C13.66,9.93 15.36,9.24 16.5,9.24C19,9.24 21,11.28 21,13.75V21M7,21H3V9H7V21M5,3A2,2 0 0,1 7,5A2,2 0 0,1 5,7A2,2 0 0,1 3,5A2,2 0 0,1 5,3Z"></path>
      </g>
      <g id="github">
        <path d="M12,2A10,10 0 0,0 2,12C2,16.42 4.87,20.17 8.84,21.5C9.34,21.58 9.5,21.27 9.5,21C9.5,20.77 9.5,20.14 9.5,19.31C6.73,19.91 6.14,17.97 6.14,17.97C5.68,16.81 5.03,16.5 5.03,16.5C4.12,15.88 5.1,15.9 5.1,15.9C6.1,15.97 6.63,16.93 6.63,16.93C7.5,18.45 8.97,18 9.54,17.76C9.63,17.11 9.89,16.67 10.17,16.42C7.95,16.17 5.62,15.31 5.62,11.5C5.62,10.39 6,9.5 6.65,8.79C6.55,8.54 6.2,7.5 6.75,6.15C6.75,6.15 7.59,5.88 9.5,7.17C10.29,6.95 11.15,6.84 12,6.84C12.85,6.84 13.71,6.95 14.5,7.17C16.41,5.88 17.25,6.15 17.25,6.15C17.8,7.5 17.45,8.54 17.35,8.79C18,9.5 18.38,10.39 18.38,11.5C18.38,15.32 16.04,16.16 13.81,16.41C14.17,16.72 14.5,17.33 14.5,18.26C14.5,19.6 14.5,20.68 14.5,21C14.5,21.27 14.66,21.59 15.17,21.5C19.14,20.16 22,16.42 22,12A10,10 0 0,0 12,2Z"></path>
      </g>
      <g id="website">
        <path d="M16,6H13V7.9H16C18.26,7.9 20.1,9.73 20.1,12A4.1,4.1 0 0,1 16,16.1H13V18H16A6,6 0 0,0 22,12C22,8.68 19.31,6 16,6M3.9,12C3.9,9.73 5.74,7.9 8,7.9H11V6H8A6,6 0 0,0 2,12A6,6 0 0,0 8,18H11V16.1H8C5.74,16.1 3.9,14.26 3.9,12M8,13H16V11H8V13Z"></path>
      </g>
      <g id="youtube">
        <path d="M10,16.5V7.5L16,12M20,4.4C19.4,4.2 15.7,4 12,4C8.3,4 4.6,4.19 4,4.38C2.44,4.9 2,8.4 2,12C2,15.59 2.44,19.1 4,19.61C4.6,19.81 8.3,20 12,20C15.7,20 19.4,19.81 20,19.61C21.56,19.1 22,15.59 22,12C22,8.4 21.56,4.91 20,4.4Z"></path>
      </g>
      <g id="instagram">
        <path d="M7.8,2H16.2C19.4,2 22,4.6 22,7.8V16.2A5.8,5.8 0 0,1 16.2,22H7.8C4.6,22 2,19.4 2,16.2V7.8A5.8,5.8 0 0,1 7.8,2M7.6,4A3.6,3.6 0 0,0 4,7.6V16.4C4,18.39 5.61,20 7.6,20H16.4A3.6,3.6 0 0,0 20,16.4V7.6C20,5.61 18.39,4 16.4,4H7.6M17.25,5.5A1.25,1.25 0 0,1 18.5,6.75A1.25,1.25 0 0,1 17.25,8A1.25,1.25 0 0,1 16,6.75A1.25,1.25 0 0,1 17.25,5.5M12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9Z"></path>
      </g>
      <g id="calendar">
        <path d="M19,19H5V8H19M16,1V3H8V1H6V3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3H18V1M17,12H12V17H17V12Z"></path>
      </g>
      <g id="people">
        <path d="M16,13C15.71,13 15.38,13 15.03,13.05C16.19,13.89 17,15 17,16.5V19H23V16.5C23,14.17 18.33,13 16,13M8,13C5.67,13 1,14.17 1,16.5V19H15V16.5C15,14.17 10.33,13 8,13M8,11A3,3 0 0,0 11,8A3,3 0 0,0 8,5A3,3 0 0,0 5,8A3,3 0 0,0 8,11M16,11A3,3 0 0,0 19,8A3,3 0 0,0 16,5A3,3 0 0,0 13,8A3,3 0 0,0 16,11Z"></path>
      </g>
      <g id="microphone">
        <path d="M12,2A3,3 0 0,1 15,5V11A3,3 0 0,1 12,14A3,3 0 0,1 9,11V5A3,3 0 0,1 12,2M19,11C19,14.53 16.39,17.44 13,17.93V21H11V17.93C7.61,17.44 5,14.53 5,11H7A5,5 0 0,0 12,16A5,5 0 0,0 17,11H19Z"></path>
      </g>
      <g id="tracks">
        <path d="M5.5,1C8,1 10,3 10,5.5C10,6.38 9.75,7.2 9.31,7.9L9.41,8H14.59L14.69,7.9C14.25,7.2 14,6.38 14,5.5C14,3 16,1 18.5,1C21,1 23,3 23,5.5C23,8 21,10 18.5,10C17.62,10 16.8,9.75 16.1,9.31L15,10.41V13.59L16.1,14.69C16.8,14.25 17.62,14 18.5,14C21,14 23,16 23,18.5C23,21 21,23 18.5,23C16,23 14,21 14,18.5C14,17.62 14.25,16.8 14.69,16.1L14.59,16H9.41L9.31,16.1C9.75,16.8 10,17.62 10,18.5C10,21 8,23 5.5,23C3,23 1,21 1,18.5C1,16 3,14 5.5,14C6.38,14 7.2,14.25 7.9,14.69L9,13.59V10.41L7.9,9.31C7.2,9.75 6.38,10 5.5,10C3,10 1,8 1,5.5C1,3 3,1 5.5,1M5.5,3A2.5,2.5 0 0,0 3,5.5A2.5,2.5 0 0,0 5.5,8A2.5,2.5 0 0,0 8,5.5A2.5,2.5 0 0,0 5.5,3M5.5,16A2.5,2.5 0 0,0 3,18.5A2.5,2.5 0 0,0 5.5,21A2.5,2.5 0 0,0 8,18.5A2.5,2.5 0 0,0 5.5,16M18.5,3A2.5,2.5 0 0,0 16,5.5A2.5,2.5 0 0,0 18.5,8A2.5,2.5 0 0,0 21,5.5A2.5,2.5 0 0,0 18.5,3M18.5,16A2.5,2.5 0 0,0 16,18.5A2.5,2.5 0 0,0 18.5,21A2.5,2.5 0 0,0 21,18.5A2.5,2.5 0 0,0 18.5,16M3.91,17.25L5.04,17.91C5.17,17.81 5.33,17.75 5.5,17.75A0.75,0.75 0 0,1 6.25,18.5L6.24,18.6L7.37,19.25L7.09,19.75L5.96,19.09C5.83,19.19 5.67,19.25 5.5,19.25A0.75,0.75 0 0,1 4.75,18.5L4.76,18.4L3.63,17.75L3.91,17.25M3.63,6.25L4.76,5.6L4.75,5.5A0.75,0.75 0 0,1 5.5,4.75C5.67,4.75 5.83,4.81 5.96,4.91L7.09,4.25L7.37,4.75L6.24,5.4L6.25,5.5A0.75,0.75 0 0,1 5.5,6.25C5.33,6.25 5.17,6.19 5.04,6.09L3.91,6.75L3.63,6.25M16.91,4.25L18.04,4.91C18.17,4.81 18.33,4.75 18.5,4.75A0.75,0.75 0 0,1 19.25,5.5L19.24,5.6L20.37,6.25L20.09,6.75L18.96,6.09C18.83,6.19 18.67,6.25 18.5,6.25A0.75,0.75 0 0,1 17.75,5.5L17.76,5.4L16.63,4.75L16.91,4.25M16.63,19.25L17.75,18.5A0.75,0.75 0 0,1 18.5,17.75C18.67,17.75 18.83,17.81 18.96,17.91L20.09,17.25L20.37,17.75L19.25,18.5A0.75,0.75 0 0,1 18.5,19.25C18.33,19.25 18.17,19.19 18.04,19.09L16.91,19.75L16.63,19.25Z"></path>
      </g>
      <g id="arrow-right-circle">
        <path d="M2,12A10,10 0 0,1 12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12M17,12L12,7V10H8V14H12V17L17,12Z"></path>
      </g>
      <g id="play">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"></path>
      </g>
      <g id="video">
        <path d="M17,10.5V7A1,1 0 0,0 16,6H4A1,1 0 0,0 3,7V17A1,1 0 0,0 4,18H16A1,1 0 0,0 17,17V13.5L21,17.5V6.5L17,10.5Z"></path>
      </g>
      <g id="chevron-right">
        <path d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z"></path>
      </g>
      <g id="chevron-left">
        <path d="M15.41,16.58L10.83,12L15.41,7.41L14,6L8,12L14,18L15.41,16.58Z"></path>
      </g>
      <g id="close">
        <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"></path>
      </g>
      <g id="gde">
        <path d="M6.4 0h-6.4l5.1 8.8 3.2-5.6z"></path>
        <path d="M12.3 13.2c-0.3 0.6-0.3 1.3 0 1.8l2.7 4.6 8.9-15.4h-6.4l-5.2 9z"></path>
        <path d="M11.6 10.7c0.3-0.6 0.3-1.3 0-1.8l-2.7-4.6-8.9 15.4h6.4l5.2-9z"></path>
        <path d="M17.4 24h6.4l-5-8.8-3.3 5.6z"></path>
      </g>
      <g id="wtm">
        <path d="M19.3 6h-3.7v5.1l-1.8-3.3h-3.8l-1.8 3.4v-5.2h-3.7v12h3.7l3.7-6.8 3.7 6.8h3.7z"></path>
        <path d="M2.3 4.2h4.1v-2.4h-5.5c-0.5 0-0.9 0.4-0.9 0.9v18.4c0 0.5 0.4 1 0.9 1h5.5v-2.3h-4.1v-15.6z"></path>
        <path d="M23 1.8h-5.5v2.4h4.1v15.7h-4.1v2.3h5.5c0.5 0 0.9-0.5 0.9-1v-18.5c0-0.5-0.4-0.9-0.9-0.9z"></path>
      </g>
      <g id="gdg">
        <path d="M19 10.9l-6.3-10.9h-3.5l8.7 15.1 1.1-1.8c0.2-0.3 0.3-0.7 0.3-1.2 0-0.4-0.1-0.8-0.3-1.2z"></path>
        <path d="M8 0h-3.5l11.1 19.2 1.7-3z"></path>
        <path d="M13.2 17.2l-3.9 6.8h3.5l2.2-3.7z"></path>
        <path d="M12.6 16.2l-1.7-3.1-6.3 10.9h3.5z"></path>
      </g>
      <g id="location">
        <path d="M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5M12,2A7,7 0 0,0 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9A7,7 0 0,0 12,2Z"></path>
      </g>
      <g id="work">
        <path d="M14,6H10V4H14M20,6H16V4L14,2H10L8,4V6H4C2.89,6 2,6.89 2,8V19A2,2 0 0,0 4,21H20A2,2 0 0,0 22,19V8C22,6.89 21.1,6 20,6Z"></path>
      </g>
      <g id="document">
        <path d="M14,17H7V15H14M17,13H7V11H17M17,9H7V7H17M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3Z"></path>
      </g>
      <g id="achievement">
        <path d="M20.2,2H19.5H18C17.1,2 16,3 16,4H8C8,3 6.9,2 6,2H4.5H3.8H2V11C2,12 3,13 4,13H6.2C6.6,15 7.9,16.7 11,17V19.1C8.8,19.3 8,20.4 8,21.7V22H16V21.7C16,20.4 15.2,19.3 13,19.1V17C16.1,16.7 17.4,15 17.8,13H20C21,13 22,12 22,11V2H20.2M4,11V4H6V6V11C5.1,11 4.3,11 4,11M20,11C19.7,11 18.9,11 18,11V6V4H20V11Z"></path>
      </g>
      <g id="directions">
        <path d="M14,14.5V12H10V15H8V11A1,1 0 0,1 9,10H14V7.5L17.5,11M21.71,11.29L12.71,2.29H12.7C12.31,1.9 11.68,1.9 11.29,2.29L2.29,11.29C1.9,11.68 1.9,12.32 2.29,12.71L11.29,21.71C11.68,22.09 12.31,22.1 12.71,21.71L21.71,12.71C22.1,12.32 22.1,11.68 21.71,11.29Z"></path>
      </g>
      <g id="bookmark-plus">
        <path d="M17,3A2,2 0 0,1 19,5V21L12,18L5,21V5C5,3.89 5.9,3 7,3H17M11,7V9H9V11H11V13H13V11H15V9H13V7H11Z"></path>
      </g>
      <g id="bookmark-check">
        <path d="M17,3A2,2 0 0,1 19,5V21L12,18L5,21V5C5,3.89 5.9,3 7,3H17M11,14L17.25,7.76L15.84,6.34L11,11.18L8.41,8.59L7,10L11,14Z"></path>
      </g>
      <g id="arrow-left">
        <path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"></path>
      </g>
      <g id="presentation">
        <path d="M19,16H5V8H19M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3Z"></path>
      </g>
      <g id="video">
        <path d="M17,10.5V7A1,1 0 0,0 16,6H4A1,1 0 0,0 3,7V17A1,1 0 0,0 4,18H16A1,1 0 0,0 17,17V13.5L21,17.5V6.5L17,10.5Z"></path>
      </g>
      <g id="bell-outline">
        <path d="M16,17H7V10.5C7,8 9,6 11.5,6C14,6 16,8 16,10.5M18,16V10.5C18,7.43 15.86,4.86 13,4.18V3.5A1.5,1.5 0 0,0 11.5,2A1.5,1.5 0 0,0 10,3.5V4.18C7.13,4.86 5,7.43 5,10.5V16L3,18V19H20V18M11.5,22A2,2 0 0,0 13.5,20H9.5A2,2 0 0,0 11.5,22Z"></path>
      </g>
      <g id="bell">
        <path d="M14,20A2,2 0 0,1 12,22A2,2 0 0,1 10,20H14M12,2A1,1 0 0,1 13,3V4.08C15.84,4.56 18,7.03 18,10V16L21,19H3L6,16V10C6,7.03 8.16,4.56 11,4.08V3A1,1 0 0,1 12,2Z"></path>
      </g>
      <g id="bell-off">
        <path d="M14,20A2,2 0 0,1 12,22A2,2 0 0,1 10,20H14M19.74,21.57L17.17,19H3L6,16V10C6,9.35 6.1,8.72 6.3,8.13L3.47,5.3L4.89,3.89L7.29,6.29L21.15,20.15L19.74,21.57M11,4.08V3A1,1 0 0,1 12,2A1,1 0 0,1 13,3V4.08C15.84,4.56 18,7.03 18,10V14.17L8.77,4.94C9.44,4.5 10.19,4.22 11,4.08Z"></path>
      </g>
      <g id="account">
        <path d="M12,19.2C9.5,19.2 7.29,17.92 6,16C6.03,14 10,12.9 12,12.9C14,12.9 17.97,14 18,16C16.71,17.92 14.5,19.2 12,19.2M12,5A3,3 0 0,1 15,8A3,3 0 0,1 12,11A3,3 0 0,1 9,8A3,3 0 0,1 12,5M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12C22,6.47 17.5,2 12,2Z"></path>
      </g>

      <g id="party">
        <path d="M22.145 4.885c-0.634 0-1.151-0.516-1.151-1.151 0-0.195-0.158-0.352-0.352-0.352s-0.352 0.158-0.352 0.352c0 0.635-0.516 1.151-1.151 1.151-0.195 0-0.352 0.158-0.352 0.352s0.158 0.352 0.352 0.352c0.634 0 1.151 0.516 1.151 1.151 0 0.195 0.158 0.352 0.352 0.352s0.352-0.158 0.352-0.352c0-0.635 0.516-1.151 1.151-1.151 0.195 0 0.352-0.158 0.352-0.352s-0.158-0.352-0.352-0.352zM20.642 5.654c-0.116-0.16-0.257-0.301-0.416-0.416 0.16-0.116 0.301-0.257 0.416-0.416 0.116 0.16 0.257 0.301 0.416 0.416-0.16 0.116-0.301 0.257-0.416 0.416z"></path>
        <path d="M20.642 16.908c-0.634 0-1.151-0.516-1.151-1.151 0-0.195-0.158-0.352-0.352-0.352s-0.352 0.158-0.352 0.352c0 0.634-0.516 1.151-1.151 1.151-0.195 0-0.352 0.158-0.352 0.352s0.158 0.352 0.352 0.352c0.634 0 1.151 0.516 1.151 1.151 0 0.195 0.158 0.352 0.352 0.352s0.352-0.158 0.352-0.352c0-0.635 0.516-1.151 1.151-1.151 0.195 0 0.352-0.158 0.352-0.352s-0.158-0.352-0.352-0.352zM19.139 17.677c-0.116-0.16-0.257-0.301-0.416-0.416 0.16-0.116 0.301-0.257 0.416-0.416 0.116 0.16 0.257 0.301 0.416 0.416-0.16 0.116-0.301 0.257-0.416 0.416z"></path>
        <path d="M6.364 13.902c-0.634 0-1.151-0.516-1.151-1.151 0-0.195-0.158-0.352-0.352-0.352s-0.352 0.158-0.352 0.352c0 0.634-0.516 1.151-1.151 1.151-0.195 0-0.352 0.158-0.352 0.352s0.158 0.352 0.352 0.352c0.634 0 1.151 0.516 1.151 1.151 0 0.195 0.158 0.352 0.352 0.352s0.352-0.158 0.352-0.352c0-0.634 0.516-1.151 1.151-1.151 0.195 0 0.352-0.158 0.352-0.352s-0.158-0.352-0.352-0.352zM4.861 14.671c-0.116-0.16-0.257-0.301-0.416-0.416 0.16-0.116 0.301-0.257 0.416-0.416 0.116 0.16 0.257 0.301 0.416 0.416-0.16 0.116-0.301 0.257-0.416 0.416z"></path>
        <path d="M5.988 2.255c-0.842 0-1.526-0.685-1.526-1.526 0-0.195-0.158-0.352-0.352-0.352s-0.352 0.158-0.352 0.352c0 0.842-0.685 1.526-1.526 1.526-0.195 0-0.352 0.158-0.352 0.352s0.158 0.352 0.352 0.352c0.842 0 1.526 0.685 1.526 1.526 0 0.195 0.158 0.352 0.352 0.352s0.352-0.158 0.352-0.352c0-0.842 0.685-1.526 1.526-1.526 0.195 0 0.352-0.158 0.352-0.352s-0.158-0.352-0.352-0.352zM4.11 3.284c-0.174-0.271-0.405-0.502-0.677-0.677 0.271-0.174 0.503-0.405 0.677-0.677 0.174 0.271 0.405 0.502 0.677 0.677-0.271 0.174-0.502 0.405-0.677 0.677z"></path>
        <path d="M7.092 5.988c0-0.113-0.054-0.22-0.146-0.286s-0.21-0.084-0.317-0.048l-3.382 1.127c-0.144 0.048-0.241 0.183-0.241 0.334v2.464c-0.226-0.118-0.491-0.186-0.775-0.186-0.816 0-1.479 0.563-1.479 1.254s0.664 1.254 1.479 1.254 1.479-0.562 1.479-1.254c0-0.042-0.003-0.084-0.007-0.125 0.005-0.023 0.007-0.047 0.007-0.072v-3.081l2.677-0.892v1.675c-0.226-0.118-0.491-0.186-0.775-0.186-0.816 0-1.479 0.563-1.479 1.254s0.664 1.254 1.479 1.254 1.479-0.563 1.479-1.254c0-0.018-0.001-0.035-0.002-0.053 0.001-0.010 0.002-0.021 0.002-0.031v-3.147zM2.231 11.197c-0.42 0-0.775-0.252-0.775-0.55s0.355-0.55 0.775-0.55 0.775 0.252 0.775 0.55c0 0.298-0.355 0.55-0.775 0.55zM5.613 9.769c-0.42 0-0.775-0.252-0.775-0.55s0.355-0.55 0.775-0.55 0.775 0.252 0.775 0.55-0.355 0.55-0.775 0.55z"></path>
        <path d="M23.248 7.942c0-0.113-0.054-0.22-0.146-0.286s-0.21-0.084-0.317-0.048l-3.382 1.127c-0.144 0.048-0.241 0.183-0.241 0.334v2.464c-0.226-0.118-0.491-0.186-0.775-0.186-0.816 0-1.479 0.563-1.479 1.254s0.664 1.254 1.479 1.254 1.479-0.563 1.479-1.254c0-0.012-0.001-0.024-0.001-0.035 0-0.007 0.001-0.014 0.001-0.021v-3.222l2.677-0.892v1.675c-0.226-0.118-0.491-0.186-0.775-0.186-0.816 0-1.479 0.563-1.479 1.254s0.664 1.254 1.479 1.254 1.479-0.563 1.479-1.254c0-0.028-0.002-0.056-0.004-0.084 0.002-0.016 0.004-0.032 0.004-0.048v-3.1zM18.387 13.151c-0.42 0-0.775-0.252-0.775-0.55s0.355-0.55 0.775-0.55 0.775 0.252 0.775 0.55c0 0.298-0.355 0.55-0.775 0.55zM21.769 11.723c-0.42 0-0.775-0.252-0.775-0.549s0.355-0.55 0.775-0.55 0.775 0.252 0.775 0.55-0.355 0.549-0.775 0.549z"></path>
        <path d="M18.233 0.027c-0.587-0.13-1.172 0.236-1.312 0.818l-1.034 3.084-2.167 2.458h-3.005l-0.965-1.929 1.004-3.006c0.093-0.28 0.072-0.579-0.060-0.843s-0.359-0.46-0.638-0.553c-0.28-0.093-0.579-0.072-0.843 0.060s-0.46 0.358-0.553 0.637l-1.089 3.244c-0.082 0.244-0.075 0.511 0.019 0.751 0.002 0.006 0.005 0.012 0.008 0.018l1.786 3.909-0.359 3.229-1.855 4.082c-0.048 0.106-0.041 0.23 0.020 0.33 0.059 0.096 0.16 0.157 0.271 0.167l-0.29 0.629c-0.008 0.018-0.015 0.037-0.020 0.057l-1.458 5.454c-0 0.002-0.001 0.004-0.001 0.006-0.148 0.59 0.213 1.191 0.803 1.338 0.088 0.022 0.178 0.033 0.268 0.033 0.465 0 0.921-0.307 1.062-0.715l1.873-5.52 0.525-1.156 1.631 0.074c0.061 0.917 0.068 0.97 0.071 0.996 0.004 0.034 0.013 0.067 0.027 0.098l2.337 5.311c0.055 0.31 0.245 0.588 0.515 0.751 0.29 0.176 0.652 0.208 0.969 0.087 0.187-0.072 0.351-0.195 0.474-0.353 0.181-0.233 0.261-0.522 0.224-0.814-0.003-0.023-0.008-0.046-0.016-0.069l-1.854-5.504c-0.006-0.063-0.018-0.195-0.035-0.379l1.175 0.053c0.239 0.010 0.423-0.226 0.353-0.455l-0.397-1.302c-0.057-0.186-0.254-0.29-0.44-0.233s-0.29 0.254-0.233 0.44l0.25 0.824-7.246-0.329 0.903-1.986 5.423-0.678 0.238 0.738c0.057 0.186 0.254 0.29 0.44 0.233s0.29-0.254 0.233-0.44l-0.651-2.081 0.362-3.259 2.699-3.075c0.14-0.143 0.237-0.32 0.284-0.514l1.104-3.367c0.004-0.011 0.007-0.022 0.009-0.033 0.132-0.594-0.244-1.185-0.838-1.317zM13.856 16.775c0.029 0.321 0.048 0.519 0.048 0.519 0.003 0.027 0.008 0.054 0.017 0.079l1.854 5.504c0.005 0.095-0.024 0.188-0.084 0.265-0.066 0.084-0.16 0.138-0.266 0.151-0.017 0.002-0.033 0.003-0.050 0.003-0.2 0-0.37-0.15-0.395-0.35-0.004-0.034-0.013-0.067-0.027-0.098l-2.333-5.301c-0.007-0.082-0.022-0.293-0.058-0.831l1.294 0.059zM8.222 16.519l1.244 0.057-0.416 0.915c-0.005 0.011-0.009 0.022-0.013 0.033l-1.878 5.535c-0.034 0.099-0.201 0.238-0.395 0.238-0.032 0-0.065-0.004-0.097-0.012-0.213-0.053-0.343-0.269-0.291-0.482l1.449-5.421 0.398-0.862zM11.148 7.092h2.003v0.911l-2.274 0.175 0.272-1.086zM8.244 4.485c-0.031-0.085-0.033-0.178-0.004-0.263l1.089-3.244c0.034-0.101 0.105-0.183 0.2-0.231s0.203-0.055 0.305-0.022c0.101 0.034 0.183 0.105 0.231 0.2s0.055 0.204 0.022 0.305l-1.050 3.144c-0.030 0.089-0.023 0.185 0.019 0.269l1.127 2.254c0.048 0.097 0.138 0.164 0.242 0.186l-0.268 1.074c-0.006 0.026-0.010 0.052-0.010 0.077l-0.181 0.014-1.72-3.763zM9.272 13.066l0.418-0.92c0.015-0.034 0.025-0.070 0.029-0.107l0.128-1.153 4.128 1.032 0.166 0.54-4.87 0.609zM13.949 11.185l-4.022-1.006 0.137-1.232 4.169-0.321-0.284 2.558zM18.386 1.176l-1.103 3.363c-0.004 0.011-0.007 0.022-0.009 0.033-0.017 0.074-0.054 0.142-0.107 0.196-0.005 0.005-0.011 0.011-0.016 0.017l-2.74 3.122-0.556 0.043v-0.857h0.024c0.103 0 0.2-0.045 0.267-0.122 0.049-0.056 1.534-1.74 2.317-2.628 0.031-0.035 0.055-0.076 0.070-0.121l1.062-3.168c0.004-0.012 0.007-0.024 0.010-0.036 0.023-0.104 0.085-0.193 0.175-0.25s0.197-0.076 0.301-0.053c0.104 0.023 0.193 0.085 0.25 0.175 0.055 0.086 0.074 0.187 0.056 0.287z"></path>
        <path d="M14.982 2.231c0-0.609-0.495-1.104-1.104-1.104-0.502 0-0.926 0.337-1.060 0.796-0.143-0.029-0.292-0.044-0.443-0.044-1.23 0-2.231 1.001-2.231 2.231s1.001 2.231 2.231 2.231c1.23 0 2.231-1.001 2.231-2.231 0-0.325-0.070-0.634-0.196-0.913 0.345-0.191 0.572-0.56 0.572-0.966zM12.376 5.636c-0.72 0-1.325-0.502-1.485-1.174h2.97c-0.159 0.672-0.764 1.174-1.485 1.174zM10.891 3.758c0.16-0.672 0.764-1.174 1.485-1.174s1.325 0.502 1.485 1.174h-2.97zM14.021 2.605c-0.155-0.169-0.336-0.314-0.537-0.43 0.028-0.194 0.194-0.343 0.395-0.343 0.22 0 0.399 0.179 0.399 0.399 0 0.166-0.104 0.315-0.257 0.373z"></path>
      </g>
      <g id="lunch">
        <path d="M5.501 12.617c-0.499 0-0.905 0.406-0.905 0.905s0.406 0.905 0.905 0.905 0.905-0.406 0.905-0.905-0.406-0.905-0.905-0.905zM5.501 13.96c-0.241 0-0.438-0.196-0.438-0.438s0.196-0.438 0.438-0.438 0.438 0.196 0.438 0.438-0.196 0.438-0.438 0.438z"></path>
        <path d="M7.427 16.821c-0.628 0-1.139 0.511-1.139 1.139s0.511 1.139 1.139 1.139 1.139-0.511 1.139-1.139-0.511-1.139-1.139-1.139zM7.427 18.631c-0.37 0-0.671-0.301-0.671-0.671s0.301-0.671 0.671-0.671 0.671 0.301 0.671 0.671-0.301 0.671-0.671 0.671z"></path>
        <path d="M23.931 14.74c-0.183-1.368-1.105-2.504-2.407-2.964-1.144-0.404-2.413-0.309-3.484 0.262-0.206 0.11-0.426 0.181-0.651 0.213 0.156-1.379 1.329-2.454 2.749-2.454 0.161 0 0.292-0.131 0.292-0.292s-0.131-0.292-0.292-0.292c-0.594 0-1.152 0.156-1.636 0.428-0.233-1.909-1.863-3.393-3.833-3.393-0.161 0-0.292 0.131-0.292 0.292 0 1.92 1.408 3.517 3.246 3.813-0.455 0.517-0.753 1.173-0.821 1.897-0.222-0.033-0.439-0.104-0.643-0.212-0.995-0.531-2.162-0.65-3.24-0.339l0.435-5.224c0.357-0.062 0.629-0.373 0.629-0.747 0-0.418-0.341-0.759-0.759-0.759h-2.357l0.801-2.442h4.838c0.161 0 0.292-0.131 0.292-0.292v-1.051c0-0.161-0.131-0.292-0.292-0.292h-5.43c-0.354 0-0.666 0.226-0.777 0.563-0 0.001-0 0.001-0.001 0.002l-1.151 3.512h-8.389c-0.419 0-0.759 0.34-0.759 0.759 0 0.374 0.273 0.685 0.63 0.747l1.293 15.523c0.052 0.622 0.581 1.108 1.205 1.108h7.73c0.624 0 1.153-0.487 1.205-1.108l0.095-1.137c0.077 0.086 0.156 0.171 0.238 0.254l1.329 1.353c0.734 0.747 1.89 0.853 2.747 0.251 0.377-0.264 0.882-0.264 1.259 0 0.372 0.262 0.801 0.39 1.227 0.389 0.555-0 1.105-0.217 1.521-0.64l1.329-1.353c1.665-1.695 2.44-4.019 2.125-6.374zM14.976 6.847c1.564 0.145 2.813 1.394 2.959 2.959-1.564-0.145-2.813-1.394-2.959-2.959zM10.808 18.753l-0.177 2.126c-0.033 0.397-0.371 0.709-0.77 0.709h-5.739c-0.398 0-0.736-0.311-0.769-0.709l-0.847-10.053c0.56 0.025 0.878 0.118 1.212 0.216 0.411 0.121 0.837 0.246 1.676 0.246s1.264-0.125 1.676-0.246c0.389-0.114 0.756-0.222 1.511-0.222s1.122 0.108 1.511 0.222c0.353 0.104 0.717 0.21 1.341 0.238l-0.114 1.345c-0.564 0.558-0.94 1.295-1.050 2.115-0.186 1.39 0.007 2.768 0.539 4.012zM11.482 10.698c-0.569-0.024-0.89-0.118-1.226-0.216-0.309-0.091-0.627-0.184-1.121-0.225l1.236-3.771h1.468l-0.357 4.212zM8.527 10.236c-0.185 0.001-0.35 0.008-0.498 0.020l1.236-3.77h0.491l-1.229 3.75zM7.383 10.354c-0.175 0.039-0.328 0.084-0.479 0.128-0.389 0.114-0.756 0.222-1.511 0.222s-1.122-0.108-1.511-0.222c-0.368-0.108-0.749-0.219-1.426-0.242l-0.316-3.754h6.511l-1.268 3.867zM12.425 6.487h0.343l-0.453 5.44c-0.127 0.061-0.25 0.129-0.367 0.202l0.478-5.642zM10.855 1.637c0-0 0-0.001 0-0.001 0.032-0.095 0.121-0.16 0.221-0.16h5.138v0.467h-4.757c-0.126 0-0.238 0.081-0.277 0.201l-0.926 2.825h-0.491l1.092-3.332zM0.759 5.552h12.466c0.097 0 0.175 0.079 0.175 0.175s-0.079 0.175-0.175 0.175h-12.466c-0.097 0-0.175-0.079-0.175-0.175s0.079-0.175 0.175-0.175zM11.48 21.949c-0.027 0.321-0.3 0.573-0.623 0.573h-7.73c-0.328 0-0.596-0.246-0.623-0.573l-1.288-15.462h0.337l1.217 14.441c0.058 0.697 0.652 1.244 1.351 1.244h5.739c0.7 0 1.293-0.546 1.352-1.244l0.1-1.197c0.098 0.16 0.202 0.316 0.312 0.47l-0.146 1.748zM21.39 20.705l-1.329 1.353c-0.533 0.543-1.373 0.619-1.995 0.182v0c-0.289-0.203-0.627-0.304-0.965-0.304s-0.676 0.101-0.965 0.304c-0.623 0.437-1.462 0.361-1.995-0.182l-1.329-1.353c-1.538-1.566-2.254-3.712-1.962-5.888 0.154-1.15 0.929-2.104 2.023-2.491 0.99-0.35 2.088-0.267 3.014 0.227 0.761 0.406 1.669 0.406 2.43 0 0.926-0.494 2.025-0.577 3.014-0.227 1.094 0.387 1.869 1.341 2.023 2.491 0.291 2.176-0.424 4.322-1.962 5.888z"></path>
        <path d="M13.477 20.051c-0.919-0.936-1.505-2.108-1.693-3.39-0.023-0.16-0.172-0.27-0.331-0.246s-0.27 0.172-0.246 0.331c0.207 1.406 0.848 2.69 1.855 3.715l1.329 1.353c0.057 0.058 0.133 0.087 0.208 0.087 0.074 0 0.148-0.028 0.205-0.084 0.115-0.113 0.117-0.298 0.004-0.413l-1.329-1.353z"></path>
        <path d="M21.213 12.657c-0.189-0.067-0.385-0.117-0.581-0.15-0.16-0.026-0.309 0.082-0.335 0.241s0.082 0.309 0.241 0.335c0.163 0.027 0.325 0.068 0.482 0.124 0.761 0.269 1.301 0.934 1.408 1.734 0.039 0.293 0.058 0.591 0.055 0.884-0.001 0.161 0.128 0.293 0.289 0.295 0.001 0 0.002 0 0.003 0 0.16 0 0.29-0.129 0.292-0.289 0.003-0.321-0.017-0.646-0.060-0.967-0.136-1.019-0.823-1.865-1.792-2.207z"></path>
        <path d="M19.255 12.564c-0.27 0.068-0.531 0.168-0.775 0.298-0.142 0.076-0.196 0.253-0.12 0.395 0.053 0.098 0.153 0.155 0.258 0.155 0.046 0 0.093-0.011 0.137-0.034 0.202-0.108 0.418-0.191 0.642-0.247 0.156-0.039 0.252-0.198 0.212-0.354s-0.198-0.252-0.354-0.212z"></path>
        <path d="M8.157 14.135c0.077 0 0.152-0.031 0.207-0.085s0.085-0.13 0.085-0.206c0-0.077-0.031-0.152-0.085-0.207s-0.13-0.085-0.207-0.085c-0.077 0-0.152 0.031-0.207 0.085s-0.085 0.13-0.085 0.207c0 0.076 0.031 0.152 0.085 0.206s0.13 0.085 0.207 0.085z"></path>
        <path d="M4.654 18.222c-0.077 0-0.152 0.031-0.207 0.085s-0.085 0.13-0.085 0.207c0 0.076 0.031 0.152 0.085 0.206s0.13 0.086 0.207 0.086c0.077 0 0.152-0.032 0.207-0.086s0.085-0.13 0.085-0.206c0-0.077-0.031-0.152-0.085-0.207s-0.13-0.085-0.207-0.085z"></path>
        <path d="M9.091 19.565c-0.077 0-0.152 0.031-0.207 0.085s-0.085 0.13-0.085 0.207c0 0.076 0.031 0.152 0.085 0.206s0.13 0.086 0.207 0.086c0.077 0 0.152-0.032 0.207-0.086s0.085-0.13 0.085-0.206c0-0.077-0.031-0.152-0.085-0.207s-0.13-0.085-0.207-0.085z"></path>
      </g>
      <g id="opening">
        <path d="M3.719 8.591l-0.029-0.029-0.315 0.029-0.2-0.229c0 0-0.029-0.029-0.029 0l-0.029 0.029-0.057 0.315-0.286 0.114-0.029 0.029c0 0 0 0.029 0.029 0.029l0.257 0.143 0.029 0.315c0 0 0 0.029 0.029 0.029h0.029l0.229-0.2 0.315 0.057h0.029v-0.029l-0.143-0.286 0.143-0.257c0.029-0.029 0.029-0.029 0.029-0.057z"></path>
        <path d="M12.386 9.821l-0.029-0.029-0.515 0.057-0.343-0.372c0 0-0.029-0.029-0.029 0l-0.029 0.029-0.086 0.486-0.429 0.143-0.029 0.029c0 0 0 0.029 0.029 0.029l0.429 0.257 0.057 0.515c0 0 0 0.029 0.029 0.029h0.029l0.372-0.343 0.486 0.114h0.029v-0.029l-0.229-0.458 0.257-0.429v-0.029z"></path>
        <path d="M19.423 9.964l0.029-0.315c0 0 0-0.029-0.029-0.029h-0.029l-0.257 0.172-0.286-0.114h-0.029c0 0-0.029 0.029 0 0.029l0.086 0.286-0.2 0.229c-0.057 0-0.086 0-0.057 0.029l0.029 0.029 0.315 0.029 0.143 0.257 0.029 0.029c0 0 0.029 0 0.029-0.029l0.114-0.286 0.315-0.057c0 0 0.029 0 0.029-0.029v-0.029l-0.229-0.2z"></path>
        <path d="M18.422 4.986l-0.029-0.029-0.315 0.029-0.2-0.229c0 0-0.029-0.029-0.029 0s-0.029 0.029-0.029 0.029l-0.057 0.315-0.286 0.114-0.029 0.029c0 0 0 0.029 0.029 0.029l0.286 0.114 0.029 0.315c0 0 0 0.029 0.029 0.029h0.029l0.229-0.2 0.315 0.057h0.029v-0.029l-0.143-0.286 0.143-0.257v-0.029z"></path>
        <path d="M7.838 4.3l-0.257-0.172v-0.315c0 0 0-0.029-0.029-0.029h-0.029l-0.229 0.2-0.286-0.086h-0.029v0.029l0.114 0.286-0.172 0.257v0.029l0.029 0.029h0.257l0.2 0.257h0.029c0 0 0.029 0 0.029-0.029l0.086-0.286 0.286-0.114 0.029-0.029c0 0 0-0.029-0.029-0.029z"></path>
        <path d="M13.53 8.877l-0.257-0.172v-0.315c0 0 0-0.029-0.029-0.029h-0.029l-0.229 0.2-0.286-0.086h-0.029v0.029l0.114 0.286-0.172 0.257v0.029l0.029 0.029h0.257l0.2 0.257h0.029c0 0 0.029 0 0.029-0.029l0.086-0.286 0.286-0.114 0.029-0.029c0 0 0-0.029-0.029-0.029z"></path>
        <path d="M23.685 23.237h-1.831v-0.973l0.658-0.486c1.23-0.858 1.516-2.574 0.658-3.805l-1.373-1.945 0.057-0.029c0.143-0.086 0.172-0.257 0.057-0.4-0.086-0.143-0.257-0.172-0.4-0.057l-1.459 1.030-2.975-7.609 6.064-5.292c0.114-0.114 0.143-0.286 0.029-0.4s-0.286-0.143-0.4-0.029l-5.921 5.178-3.147-8.038c-0.057-0.143-0.229-0.229-0.372-0.172s-0.229 0.229-0.172 0.372l3.204 8.238-4.377 3.862-4.434-3.862 3.204-8.238c0.057-0.143-0.029-0.315-0.172-0.372s-0.315 0.029-0.372 0.172l-3.118 8.038-5.893-5.178c-0.114-0.114-0.286-0.086-0.4 0.029s-0.086 0.286 0.029 0.4l6.064 5.292-2.975 7.609-1.173-0.83-0.286-0.2c-0.143-0.086-0.315-0.057-0.4 0.057-0.086 0.143-0.057 0.315 0.057 0.4l0.057 0.029-1.373 1.945c-0.858 1.23-0.572 2.946 0.658 3.805l0.658 0.486v0.973h-1.831c-0.172 0-0.286 0.114-0.286 0.286s0.114 0.286 0.286 0.286h4.262c0.172 0 0.286-0.114 0.286-0.286s-0.114-0.286-0.286-0.286h-1.831v-0.629c0.372 0.172 0.744 0.257 1.144 0.257 0.143 0 0.315 0 0.458-0.029 0.715-0.114 1.344-0.515 1.774-1.116l1.373-1.945 0.057 0.029c0.057 0.029 0.114 0.057 0.172 0.057 0.086 0 0.172-0.029 0.229-0.114 0.086-0.143 0.057-0.315-0.057-0.4l-0.286-0.2-1.173-0.83 5.578-4.892 5.578 4.892-1.173 0.83-0.286 0.2c-0.143 0.086-0.172 0.257-0.057 0.4 0.057 0.086 0.143 0.114 0.229 0.114 0.057 0 0.114-0.029 0.172-0.057l0.057-0.029 1.373 1.945c0.544 0.744 1.373 1.144 2.231 1.144 0.4 0 0.801-0.086 1.173-0.257v0.601h-1.831c-0.172 0-0.286 0.114-0.286 0.286s0.114 0.286 0.286 0.286h4.262c0.172 0 0.286-0.114 0.286-0.286s-0.172-0.257-0.315-0.257zM7.008 19.461l-1.373 1.945c-0.343 0.486-0.83 0.801-1.402 0.887s-1.144-0.029-1.631-0.372l-0.83-0.572c-0.486-0.343-0.801-0.83-0.887-1.402s0.029-1.144 0.372-1.631l1.373-1.945 4.377 3.089zM5.921 17.973l-1.516-1.058 2.946-7.523 4.205 3.69-5.635 4.892zM12.415 13.053l4.205-3.69 2.946 7.523-1.545 1.087-5.607-4.92zM18.336 21.406l-1.373-1.945 4.348-3.089 1.373 1.945c0.343 0.486 0.458 1.058 0.372 1.631s-0.4 1.058-0.887 1.402l-0.83 0.572c-0.973 0.687-2.317 0.458-3.004-0.515z"></path>
      </g>
      <g id="registration">
        <path d="M19.875 0h-15.75c-1.034 0-1.875 0.841-1.875 1.875v20.25c0 1.034 0.841 1.875 1.875 1.875h15.75c1.034 0 1.875-0.841 1.875-1.875v-20.25c0-1.034-0.841-1.875-1.875-1.875zM21 22.125c0 0.62-0.505 1.125-1.125 1.125h-15.75c-0.62 0-1.125-0.505-1.125-1.125v-20.25c0-0.62 0.505-1.125 1.125-1.125h15.75c0.62 0 1.125 0.505 1.125 1.125v20.25z"></path>
        <path d="M9.75 4.875h6.75c0.207 0 0.375-0.168 0.375-0.375s-0.168-0.375-0.375-0.375h-6.75c-0.207 0-0.375 0.168-0.375 0.375s0.168 0.375 0.375 0.375z"></path>
        <path d="M19.125 5.625h-9.375c-0.207 0-0.375 0.168-0.375 0.375s0.168 0.375 0.375 0.375h9.375c0.207 0 0.375-0.168 0.375-0.375s-0.168-0.375-0.375-0.375z"></path>
        <path d="M9.75 7.875h8.25c0.207 0 0.375-0.168 0.375-0.375s-0.168-0.375-0.375-0.375h-8.25c-0.207 0-0.375 0.168-0.375 0.375s0.168 0.375 0.375 0.375z"></path>
        <path d="M7.875 16.125h-3c-0.207 0-0.375 0.168-0.375 0.375v3c0 0.207 0.168 0.375 0.375 0.375h3c0.207 0 0.375-0.168 0.375-0.375v-3c0-0.207-0.168-0.375-0.375-0.375zM7.5 19.125h-2.25v-2.25h2.25v2.25z"></path>
        <path d="M9.75 16.875h6.75c0.207 0 0.375-0.168 0.375-0.375s-0.168-0.375-0.375-0.375h-6.75c-0.207 0-0.375 0.168-0.375 0.375s0.168 0.375 0.375 0.375z"></path>
        <path d="M19.125 17.625h-9.375c-0.207 0-0.375 0.168-0.375 0.375s0.168 0.375 0.375 0.375h9.375c0.207 0 0.375-0.168 0.375-0.375s-0.168-0.375-0.375-0.375z"></path>
        <path d="M18 19.125h-8.25c-0.207 0-0.375 0.168-0.375 0.375s0.168 0.375 0.375 0.375h8.25c0.207 0 0.375-0.168 0.375-0.375s-0.168-0.375-0.375-0.375z"></path>
        <path d="M7.875 10.125h-3c-0.207 0-0.375 0.168-0.375 0.375v3c0 0.207 0.168 0.375 0.375 0.375h3c0.207 0 0.375-0.168 0.375-0.375v-3c0-0.207-0.168-0.375-0.375-0.375zM7.5 13.125h-2.25v-2.25h2.25v2.25z"></path>
        <path d="M9.75 10.875h6.75c0.207 0 0.375-0.168 0.375-0.375s-0.168-0.375-0.375-0.375h-6.75c-0.207 0-0.375 0.168-0.375 0.375s0.168 0.375 0.375 0.375z"></path>
        <path d="M19.125 11.625h-9.375c-0.207 0-0.375 0.168-0.375 0.375s0.168 0.375 0.375 0.375h9.375c0.207 0 0.375-0.168 0.375-0.375s-0.168-0.375-0.375-0.375z"></path>
        <path d="M9.75 13.875h8.25c0.207 0 0.375-0.168 0.375-0.375s-0.168-0.375-0.375-0.375h-8.25c-0.207 0-0.375 0.168-0.375 0.375s0.168 0.375 0.375 0.375z"></path>
        <path d="M8.36 3.485l-0.64 0.64h-1.72c-0.207 0-0.375 0.168-0.375 0.375s0.168 0.375 0.375 0.375h0.97l-0.97 0.97-1.235-1.235c-0.146-0.146-0.384-0.146-0.53 0s-0.146 0.384 0 0.53l0.265 0.265v2.095c0 0.207 0.168 0.375 0.375 0.375h3c0.207 0 0.375-0.168 0.375-0.375v-1.125c0-0.207-0.168-0.375-0.375-0.375s-0.375 0.168-0.375 0.375v0.75h-2.25v-0.97l0.485 0.485c0.073 0.073 0.169 0.11 0.265 0.11s0.192-0.037 0.265-0.11l2.625-2.625c0.146-0.146 0.146-0.384 0-0.53s-0.384-0.146-0.53 0z"></path>
      </g>
      <g id="coffee-break">
        <path d="M13.126 18.090c0.701 0 1.303-0.231 1.741-0.668 0.571-0.572 0.787-1.412 0.612-2.367-0.166-0.904-0.67-1.814-1.418-2.562-0.925-0.925-2.115-1.477-3.186-1.477-0.702 0-1.304 0.231-1.742 0.669-0.57 0.57-0.786 1.41-0.61 2.366 0.166 0.904 0.67 1.814 1.418 2.562 0.925 0.925 2.115 1.477 3.186 1.477zM9.442 12.537l0.998 0.998c0.075 0.075 0.173 0.112 0.271 0.112s0.196-0.037 0.271-0.112c0.15-0.15 0.15-0.392 0-0.542l-0.998-0.998c0.25-0.14 0.552-0.212 0.891-0.212 0.871 0 1.86 0.468 2.644 1.252 0.639 0.639 1.068 1.406 1.206 2.159 0.098 0.535 0.039 1.010-0.166 1.376l-2.494-2.494c-0.15-0.15-0.392-0.15-0.542 0s-0.15 0.392 0 0.542l2.494 2.494c-0.25 0.14-0.552 0.212-0.891 0.212-0.871 0-1.86-0.468-2.644-1.252-0.639-0.639-1.068-1.406-1.206-2.159-0.099-0.535-0.039-1.010 0.166-1.376z"></path>
        <path d="M20.298 3.064h-1.233l-0.693-2.774c-0.043-0.171-0.196-0.29-0.372-0.29h-12c-0.176 0-0.329 0.12-0.372 0.29l-0.693 2.774h-1.233c-0.212 0-0.383 0.171-0.383 0.383v2.043c0 0.212 0.171 0.383 0.383 0.383h0.414l0.672 7.95c0.017 0.2 0.184 0.351 0.381 0.351 0.011 0 0.022-0 0.033-0.001 0.211-0.018 0.367-0.203 0.349-0.414l-0.386-4.566h13.669l-0.906 10.723h-11.857l-0.391-4.631c-0.018-0.211-0.203-0.368-0.414-0.349s-0.367 0.203-0.349 0.414l0.701 8.301c0.017 0.198 0.183 0.351 0.382 0.351h12c0.199 0 0.365-0.152 0.382-0.351l1.502-17.777h0.414c0.212 0 0.383-0.171 0.383-0.383v-2.043c0-0.212-0.171-0.383-0.383-0.383zM6.352 23.234l-0.216-2.553h11.728l-0.216 2.553h-11.296zM18.899 8.426h-13.799l-0.216-2.553h14.23l-0.216 2.553zM19.915 5.106h-0.39c-0 0-15.44 0-15.44 0v-1.277h1.141c0.005 0 0.011 0 0.017 0h11.991c0.212 0 0.383-0.171 0.383-0.383s-0.171-0.383-0.383-0.383h-11.51l0.574-2.298h11.402l0.693 2.774c0.043 0.171 0.196 0.29 0.372 0.29h1.149v1.277z"></path>
      </g>
      <g id="checked">
        <path d="M10,17L5,12L6.41,10.58L10,14.17L17.59,6.58L19,8M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"></path>
      </g>
      <g id="open-in-new">
        <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"></path>
      </g>
      <g id="movie">
        <path d="M18,4L20,8H17L15,4H13L15,8H12L10,4H8L10,8H7L5,4H4A2,2 0 0,0 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V4H18Z"></path>
      </g>
      <g id="ticket">
        <path d="M15.58,16.8L12,14.5L8.42,16.8L9.5,12.68L6.21,10L10.46,9.74L12,5.8L13.54,9.74L17.79,10L14.5,12.68M20,12C20,10.89 20.9,10 22,10V6C22,4.89 21.1,4 20,4H4A2,2 0 0,0 2,6V10C3.11,10 4,10.9 4,12A2,2 0 0,1 2,14V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V14A2,2 0 0,1 20,12Z"></path>
      </g>
      <g id="add-circle-outline">
        <path d="M13 7h-2v4H7v2h4v4h2v-4h4v-2h-4V7zm-1-5C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"></path>
      </g>
      <g id="filter-list">
        <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"></path>
      </g>
      <g id="insert-comment">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
      </g>
      <g id="feedback">
        <path d="M0 0h24v24H0z" fill="none"/>
        <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 12h-2v-2h2v2zm0-4h-2V6h2v4z"/>
      </g>
    </defs>
  </svg>
</iron-iconset-svg>`;

document.head.appendChild(documentContainer.content);
