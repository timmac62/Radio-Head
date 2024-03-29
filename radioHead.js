$(function() {
    //
    // radioHead.js
    //
    // To Do:
    //          ✓ (1) static jquery libraries
    //          (2) create GitHub branch and merge this new version
    //          (3) html and css look and feel - basic settings
    //
    // Common defines that make readability easier
    //
    const LOGGER                            = true;
    const CLEAR_BIT                         = 0;
    const SET_BIT                           = 1;
    const ENABLED                           = 0;
    const DISABLED                          = 1;
    const EQ_OFF                            = 0;
    const EQ_LOUDNESS                       = 1;
    const EQ_SOUND                          = 2;
    const XFR_55HZ                          = 0;
    const XFR_85HZ                          = 1;
    const XFR_120HZ                         = 2;
    const XFR_160HZ                         = 3;
    const TUBE_EM_ENABLED                   = 0;
    const TUBE_EM_SOUND                     = 1;
    const TAB_SETUP                         = 0;
    const TAB_BASIC_SETTINGS                = 1;
    const TAB_DAB_SETTINGS                  = 2;
    const TAB_CONFIG_DATA                   = 3;
    const DAB_ACTIVE                        = 1;
    const DAB_NOT_ACTIVE                    = 0;
    const DAB_MAXIMUM_STATIONS              = 160;
    const DAB_MAXIMUM_ACTIVE_STATIONS       = 50;
    const DAB_MAXIMUM_ENSEMBLES             = 43;
    //
    // Application Defaults
    //
    const enablers                          = ['Enabled', 'Disabled'];
    const eqs                               = ['Off', 'Loudness', 'EQ'];
    const tubeEms                           = ['Enabled', 'Sound'];
    const defaultTreble                     = 0;
    const defaultMid                        = 0;
    const defaultBass                       = 0;
    const defaultLoudness                   = 7;
    const defaultSubwoofer                  = 0;
    const xfrs                              = ['55 Hz', '85 Hz', '120 Hz', '160 Hz'];
    const defaultXfr                        = xfrs[XFR_85HZ];
    const defaultAutoVolume                 = 40;
    const defaultAutoVolumeEnable           = enablers[ENABLED];
    const defaultEQ                         = eqs[EQ_SOUND];
    const defaultBalance                    = 0;
    const defaultFader                      = 0;
    const defaultTone                       = 0;
    const defaultTubeEmulation              = tubeEms[TUBE_EM_ENABLED];
    const defaultHDFM                       = enablers[ENABLED];
    const defaultHDAM                       = enablers[ENABLED];
    //
    // config data - all values occupy 1 byte unless denoted otherwise
    // set the default size without any DAB information
    //
    var ad_fmr_config                       = [];
    const CONFIG_BUFFER_SIZE                = 40;
    const CONFIG_OC_MAJOR_VERSION           = 0;
    const CONFIG_OC_MINOR_VERSION           = CONFIG_OC_MAJOR_VERSION + 1;
    const CONFIG_FILE_LENGTH                = CONFIG_OC_MINOR_VERSION + 1;
    const CONFIG_CALL_RESPONSE_LINK_VERSION = CONFIG_FILE_LENGTH + 1;
    const CONFIG_SERIAL_NUMBER              = CONFIG_CALL_RESPONSE_LINK_VERSION + 1;
    const CONFIG_FMR_HARDWARE_VERSION       = CONFIG_SERIAL_NUMBER + 10;
    const CONFIG_FMR_FIRMWARE_VERSION       = CONFIG_FMR_HARDWARE_VERSION + 1;
    const CONFIG_SETUP_SPEECH_ROM_VERSION   = CONFIG_FMR_FIRMWARE_VERSION + 1;
    const CONFIG_SETUP_TABLE                = CONFIG_SETUP_SPEECH_ROM_VERSION + 1;
    const CONFIG_USER_SETTINGS              = CONFIG_SETUP_TABLE + 12;
    const CONFIG_DAB_SCAN_INDEX             = CONFIG_USER_SETTINGS + 10;
    const CONFIG_DAB_CHANNELS               = CONFIG_DAB_SCAN_INDEX + 1;
    const CONFIG_CHECKSUM                   = CONFIG_DAB_CHANNELS + 80;
    const PROGRAM_ERROR = "Something is WRONG in the state of Denmark!";
    //
    // ui variables for all settings
    //
    var treble                              = defaultTreble;
    var mid                                 = defaultMid;
    var bass                                = defaultBass;
    var loudness                            = defaultLoudness;
    var subwoofer                           = defaultSubwoofer;
    var xfr                                 = defaultXfr;
    var autoVolume                          = defaultAutoVolume;
    var autoVolumeEnable                    = defaultAutoVolumeEnable;
    var equalizer                           = defaultEQ;
    var balance                             = defaultBalance;
    var fader                               = defaultFader;
    var tone                                = defaultTone;
    var tubeEmulation                       = defaultTubeEmulation;
    var hdFM                                = defaultHDFM;
    var hdAM                                = defaultHDAM;
    //
    // misc: config, frequencies and tool tips
    //
    var cfgFileName;
    let ensembleFrequencies = [
        '5A', '5B', '5C', '5D',
        '6A', '6B', '6C', '6D',
        '7A', '7B', '7C', '7D',
        '8A', '8B', '8C', '8D',
        '9A', '9B', '9C', '9D',
        '10A', '10N', '10B', '10C', '10D',
        '11A', '11N', '11B', '11C', '11D',
        '12A', '12N', '12B', '12C', '12D',
        '13A', '13B', '13C', '13D', '13E',
        '13F'
    ];
    //
    // config data cell tooltips - very nice touch for development
    //
    // NOTE:    BE VERY PARTICULAR WITH THE STRUCTURE - MODIFY AND/OR
    //          ADD A TOOL TIP AND TEST RIGHT AWAY!!!
    //
    //          it NEEDS to match the offsets for ad_fmr_config defined above
    //
    var cellToolTips = [
        "option card major version\x0A\x0A"
            + "b7: 0-BTU 1-USB option card product name\x0A"
            + "b6-4: major version\x0A"
            + "b3-0: hardware version",
        "option card minor version\x0A\x0A"
            + "b7-0: minor version",
        "configuration file length\x0A\x0A",
        "calling resp code / linkVer\x0A\x0A"
            + "b7-4: 0x0 get base, 0x01 get_dab_ids, 0x2 get_live\x0A"
            + "b3-0: link version (currently 0)",
        "fmr serial number 0",
        "fmr serial number 1",
        "fmr serial number 2",
        "fmr serial number 3",
        "fmr serial number 4",
        "fmr serial number 5",
        "fmr serial number 6",
        "fmr serial number 7",
        "fmr serial number 8",
        "fmr serial number 9",
        "fmr_series / fmr_hardware ver\x0A\x0A"
            + "b7-4: major version\x0A"
            + "b3-0: hardware version",
        "fmr_firmware_version\x0A\x0A"
            + "b7-0: minor version",
        "setup_ver | speech_rom_ver\x0A\x0A"
            + "b7-4: setup version format\x0A"
            + "b3-0: speech rom version",
        "setup table byte 0\x0A\x0A"
            + "b0: 0-->Pot Tuned, 1-->L.O. Tuned / Tuner Type\x0A"
            + "b1: 0-->Enabled, 1-->Disabled / Auxillary Input Power Select\x0A"
            + "b2: 0-->Enabled, 1-->Disabled / Auxillary Input Tuner Select\x0A"
            + "b3: 0-->Enabled, 1-->Disabled / Auxillary Input VOX Select\x0A"
            + "b4: 0-->Detected, 1-->Not Detected / Balance Control\x0A"
            + "b5: 0-->Rheostat, 1-->Potentiometer / Balance Control Type\x0A"
            + "b6: 0-->Detected, 1-->Not Detected / Fader Control\x0A"
            + "b7: 0-->Low, 1-->High / Fader Control Impedance Type",
        "setup table byte 1\x0A\x0A"
            + "b0: 0-->World, 1-->America / AM/FM Channel Spacing\x0A"
            + "b1: 0-->Japan, 1-->World / Bit 0 set to World\x0A"
            + "             1610kHz    1710kHz  / Bit 0 set to America, top of AM band\x0A"
            + "b2: 0-->Detected, 1-->Not Detected / Bandswitch switch\x0A"
            + "b3: 0-->AM/FM/DAB, 1-->AM/FM / Bandswitch DAB Enable\x0A"
            + "b4: 0-->Detected, 1-->Not Detected / Wonderbar Pushbuttons\x0A"
            + "b5: 0-->Enabled, 1-->Disabled / ElectroTouch Mode\x0A"
            + "b6: 0-->Detected, 1-->Not Detected / Tone Switch\x0A"
            + "b7: 0-->Rheostat, 1-->Potentiometer / Tone Control Type",
        "setup table byte 2\x0A\x0A"
            + "b0: 0-->High, 1-->Low / Input Level For Low Sensitivity Seek\x0A"
            + "b1: 0-->AM, 1-->FM / Band Switch AM/FM Ground Polarity\x0A"
            + "b2: 0-->High, 1-->Low / Input Level for Aux Switch Input\x0A"
            + "b3: 0-->Enabled, 1-->Disabled / Reverse FM Band\x0A"
            + "b4: 0-->Detected, 1-->Not Detected / RGB LED\x0A"
            + "b5: 0-->Enabled, 1-->Disabled / Tube Emulation Mode Installed\x0A"
            + "b6: 0-->Disabled, 1-->Enabled / L.O. Shunt Capacitor\x0A"
            + "b7: 0-->Disabled, 1-->Enabled / L.O. Shunt Inductor",
        "setup table byte 3\x0A\x0A"
            + "b0: 0-->Low Current, 1-->High Current / Power Switch Wiring Type\x0A"
            + "b1: 0-->0, 1-->1 / Virtual Responsiveness bit 0\x0A"
            + "b2: 0-->1, 1-->0 / Virtual Responsiveness bit 1\x0A"
            + "b3: 0-->Enabled, 1-->Disabled / Enhanced Seek Control\x0A"
            + "b4: Not Used\x0A"
            + "b5: Not Used\x0A"
            + "b6: Not Used\x0A"
            + "b7: Not Used",
        "setup table byte 4\x0A\x0A"
            + "b0: 0-->Enabled, 1-->Disabled / Left Front Grounded Speaker\x0A"
            + "b1: 0-->Enabled, 1-->Disabled / Right Front Grounded Speaker\x0A"
            + "b2: 0-->Enabled, 1-->Disabled / Left Rear Grounded Speaker\x0A"
            + "b3: 0-->Enabled, 1-->Disabled / Right Rear Grounded Speaker\x0A"
            + "b4: 0-->Enabled, 1-->Disabled / Front Power Amplifier\x0A"
            + "b5: 0-->Enabled, 1-->Disabled / Rear Power Amplifier\x0A"
            + "b6: 0-->Enabled, 1-->Disabled / Right Channel High Efficiency\x0A"
            + "b7: 0-->Enabled, 1-->Disabled / Left Channel High Efficiency",
        "setup table byte 5\x0A\x0A"
            + "b0: 0-->Detected, 1-->Not Detected / Left Front Speaker\x0A"
            + "b1: 0-->Detected, 1-->Not Detected / Right Front Speaker\x0A"
            + "b2: 0-->Detected, 1-->Not Detected / Left Rear Speaker\x0A"
            + "b3: 0-->Detected, 1-->Not Detected / Right Rear Speaker\x0A"
            + "b4: 0-->Detected, 1-->Not Detected / Left Front Line Load\x0A"
            + "b5: 0-->Detected, 1-->Not Detected / Right Front Line Load\x0A"
            + "b6: 0-->Detected, 1-->Not Detected / Left Rear Line Load\x0A"
            + "b7: 0-->Detected, 1-->Not Detected / Right Rear Line Load",
        "setup table byte 6\x0A\x0A"
            + "b7-0 Volume Control Center Value",
        "setup table byte 7\x0A\x0A"
            + "b7-0 Tone Control Center Value",
        "setup table byte 8\x0A\x0A"
            + "b7-0 Tuner low frequency calibration in kHz (decimal value)\x0A"
            + "     [15-0] used with setup table byte 9",
        "setup table byte 9\x0A\x0A"
            + "b7-0 Tuner low frequency calibration in kHz (decimal value)\x0A"
            + "     [15-0] used with setup table byte 8",
        "setup table byte 10\x0A\x0A"
            + "b7-0 Tuner high frequency calibration in kHz (decimal value)\x0A"
            + "     [15-0] used with setup table byte 11",
        "setup table byte 11\x0A\x0A"
            + "b7-0 Tuner high frequency calibration in kHz (decimal value)\x0A"
            + "     [15-0] used with setup table byte 10",
        "user settings byte 0\x0A\x0A"
            + "b0: 0-->Disabled, 1-->Enabled / Loudness\x0A"
            + "b1: 0-->Disabled, 1-->Enabled / EQ\x0A"
            + "b2: 0-->Disabled, 1-->Enabled / AutoVolume\x0A"
            + "b3: 0-->Disabled, 1-->Enabled / Tube Emulation\x0A"
            + "b4: 0-->Disabled, 1-->Enabled / Tube Emulation Vibrator Sound Effect\x0A"
            + "b5: Not Used\x0A"
            + "b6: 0-->Disabled, 1-->Enabled / FMHD\x0A"
            + "b7: 0-->Disabled, 1-->Enabled / AMHD",
        "user settings byte 1\x0A\x0A"
            + "b7-0 Soft Balance +/- 24dB, signed byte xor 0x7f",
        "user settings byte 2\x0A\x0A"
            + "b7-0 Soft Fader +/- 24dB, signed byte xor 0x7f",
        "user settings byte 3\x0A\x0A"
            + "b7-0 Soft Tone +/- 24dB, signed byte xor 0x7f",
        "user settings byte 4\x0A\x0A"
            + "b7-0 AutoVol 20-60. step 2, unsigned byte xor 0x7f",
        "user settings byte 5\x0A\x0A"
            + "b7-0 Treble +/- 10dB, signed byte",
        "user settings byte 6\x0A\x0A"
            + "b7-0 Mid +/- 10dB, signed byte",
        "user settings byte 7\x0A\x0A"
            + "b7-0 Bass +/- 10dB, signed byte",
        "user settings byte 8\x0A\x0A"
            + "b7-0 Loudness 0-15dB, unsigned byte",
        "user settings byte 9\x0A\x0A"
            + "b5-0 Subwoofer Gain +/- 10dB, signed bits\x0A"
            + "b7-6 Xover Frequency 0x0-55, 0x1-85, 0x2-120, 0x3-160",
        "dab scan index\x0A\x0A"
            + "sequential number each time the radio scans for new stations, used for dirty",
        "dab channels b7 Set\x0A\x0A"
            + "b7 Set new Ensemble\x0A"
            + "b6 Set Station Active\x0A"
            + "b5-0 Ensemble Index, freq0 - freq40",
        "dab channels b7 Clear\x0A\x0A"
            + "byte may contain 1-3 stations using b5 down to b0\x0A"
            + "b6 0\x0A"
            + "b5-4 upper bit set entry is valid, lower bit Active station\x0A"
            + "b3-2 upper bit set entry is valid, lower bit Active station\x0A"
            + "b1-0 upper bit set entry is valid, lower bit Active station"
    ];
    //
    // initial setup - ensure we start with Factory Defaults
    //
    function setup() {
        //
        // initialize config array and length
        //
        ad_fmr_config = new Uint8Array(CONFIG_BUFFER_SIZE);
        ad_fmr_config[CONFIG_FILE_LENGTH] = CONFIG_BUFFER_SIZE;
        //
        // and set the factory defaults
        //
        setFactoryDefaults();
    }
    document.addEventListener("DOMContentLoaded", setup());
    //
    // jQueryUI initializations - tabs, checkboxradio
    //
    $(function() {
        $("#tabs").tabs();
    });
    $( "input[type='radio']" ).checkboxradio();
    //
    // Key Handlers for development/testing
    //
    document.onkeydown = keydown;
    function keydown(evt){
      if (!evt) evt = event;
      //
      // Ctrl Alt A?
      //
      if (evt.ctrlKey && evt.altKey && evt.keyCode==65){
        alert("CTRL+ALT+A");
        //
        // toggle config tab
        //
        // var toggleTab =  $( "#tabs-4" ).tabs( "option", "hide" );
        // console.assert(LOGGER, 'toggleTab ' + toggleTab);
        // if (toggleTab === true) {
        //     $( "#tabs-4" ).tabs( "option", "show", { effect: "blind", duration: 1000 } );
        // } else {
        //     $( "#tabs-4" ).tabs( "option", "hide", { effect: "explode", duration: 1000 } );
        // }
      }
    }
    //
    // Setup Configuration File
    //
    function readFile(input) {
        var file, fr;
        //
        // read the file
        //
        file = input.files[0];
        fr = new FileReader();
        fr.onload = receivedBinary;
        fr.readAsBinaryString(file);
        //
        // save the filename sans the extension
        //
        var fullPath = document.getElementById('read-file').value;
        if (fullPath) {
            var startIndex = (fullPath.indexOf('\\') >= 0 ? fullPath.lastIndexOf('\\') : fullPath.lastIndexOf('/'));
            cfgFileName = fullPath.substring(startIndex);
            if (cfgFileName.indexOf('\\') === 0 || cfgFileName.indexOf('/') === 0) {
                cfgFileName = cfgFileName.substring(1);
            }
            //
            // remove the extension
            //
            cfgFileName = cfgFileName.substring(0, cfgFileName.lastIndexOf('.')) || cfgFileName;
        }
        function receivedBinary() {
            var result, n;
            result = fr.result;
            //
            // allocate new buffer and rely on garbage collector to do its job
            //
            new_length = result.length;
            ad_fmr_config = new Uint8Array(result.length);
            //
            // copy over existing array
            //
            for (n = 0; n < result.length; ++n) {
                ad_fmr_config[n] = result.charCodeAt(n);
            }
        }
    }
    //
    // select configuration file
    //
    const fileSelector = document.getElementById('read-file');
    fileSelector.addEventListener('change', (event) => {
        readFile(event.target);
    });
    //
    // Set Defaults
    //
    $('li#setDefaults').on('click', function() {
        setFactoryDefaults();
        updateUIElements();
        $(this).fadeTo("slow", 0.8);
    });
    //
    // Save Settings to Config File
    //
    $('li#saveConfigFile').on('click', function() {
        $(this).fadeTo("slow", 0.8);
        var saveByteArray = (function () {
            var a = document.createElement("a");
            document.body.appendChild(a);
            a.style = "display: none";
            return function (data, name) {
                var blob = new Blob(data, {type: "octet/stream"}),
                    url = window.URL.createObjectURL(blob);
                a.href = url;
                a.download = name;
                a.click();
                window.URL.revokeObjectURL(url);
            };
        }());
        saveByteArray([ad_fmr_config], cfgFileName + ".set");
        console.assert(LOGGER, "save file name: " + cfgFileName );
    });
    //*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*
    //
    // UI Element Section
    //
    //*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*
    //
    // Basic Settings SOUND
    // Treble slider
    //
    $("#slider-treble").slider({ value: 0, min: -15, max: 15, step: 1, animate: true,
        slide: function( event, ui ) {
            //
            // update treble label
            //
            $( "#treble" ).val( ui.value + "db");
            setTreble(ui.value);
        }
    })
    //
    // Mid slider
    //
    $("#slider-mid").slider({ value: 0, min: -15, max: 15, step: 1, animate: true,
        slide: function( event, ui ) {
            //
            // update mid label
            //
            $( "#mid" ).val( ui.value + "db");
            setMid(ui.value);
        }
    })
    //
    // Bass slider
    //
    $("#slider-bass").slider({ value: 0, min: -15, max: 15, step: 1, animate: true,
        slide: function( event, ui ) {
            //
            // update bass label
            //
            $( "#bass" ).val( ui.value + "db");
            setBass(ui.value);
        }
    })
    //
    // Loudness slider
    //
    $("#slider-loudness").slider({ value: 7, min: 0, max: 15, step: 1, animate: true,
        slide: function( event, ui ) {
            //
            // update loudness label
            //
            $( "#loudness" ).val( ui.value + "db");
            setLoudness(ui.value);
        }
    })
    //
    // Subwoofer slider
    //
    $("#slider-subwoofer").slider({ value: 0, min: -15, max: 15, step: 1, animate: true,
        slide: function( event, ui ) {
            //
            // update subwoofer label
            //
            $( "#subwoofer" ).val( ui.value + "db");
            setSubwoofer(ui.value);
        }
    })
    //
    // XFR selection
    //
    $( "#xfr" ).selectmenu({
      change: function( event, ui ) {
            //
            // note that ui.value is undefined here - use the selected option below
            //
            xfr = $( "#xfr option:selected" ).val();
            setXfr(xfr);
      }
    });
    //
    // Basic Settings VOLUME
    // Auto Volume slider and label
    //
    $("#slider-autoVol").slider({ value: 40, min: 20, max: 60, step: 2, animate: true,
        slide: function( event, ui ) {
            //
            // update autoVol label
            //
            $( "#autoVol" ).val( ui.value );
            setAutoVolume(ui.value);
        }
    })
    $( "#autoVol" ).val( $( "#slider-autoVol" ).slider( "value" ) + "db");
    //
    // Auto Volume Enable
    //
    $('input[type=radio][name=ave]').change(function() {
        if($('#ave-enabled').is(':checked')) {
            //
            // enable the autovolume slider
            //
            $( "#slider-autoVol" ).slider( "enable" );
            //
            // and update the new setting
            //
            autoVolumeEnable = "Enabled";
            setAutoVolumeEnable(autoVolumeEnable);
        }
        else if($('#ave-disabled').is(':checked')){
            //
            // disable the autovolume slider
            //
            $( "#slider-autoVol" ).slider( "disable" );
            //
            // and update the new setting
            //
            autoVolumeEnable = "Disabled";
            setAutoVolumeEnable(autoVolumeEnable);
        }
    });
    //
    // Equalizer
    //
    $('input[type=radio][name=eq]').change(function() {
        if($('#eq-off').is(':checked')) {
            equalizer = "Off";
            setEqualizer(equalizer);
        }
        else if($('#eq-loudness').is(':checked')){
            equalizer = "Loudness";
            setEqualizer(equalizer);
        }
        else if($('#eq-EQ').is(':checked')){
            equalizer = "EQ";
            setEqualizer(equalizer);
        }
    });
    //
    // Balance/Fader/Tone
    //
    $("#slider-balance").slider({ value: 0, min: -15, max: 15, step: 1, animate: true,
        slide: function( event, ui ) {
            //
            // update balance label
            //
            $( "#balance" ).val( ui.value + "db");
            setBalance(ui.value);
        }
    })
    $("#slider-fader").slider({ value: 0, min: -15, max: 15, step: 1, animate: true,
        slide: function( event, ui ) {
            //
            // update fader label
            //
            $( "#fader" ).val( ui.value + "db");
            setFader(ui.value);
        }
    })
    $("#slider-tone").slider({ value: 0, min: -15, max: 15, step: 1, animate: true,
        slide: function( event, ui ) {
            //
            // update tone label
            //
            $( "#tone" ).val( ui.value + "db");
            setTone(ui.value);
        }
    })
    //
    // Tube Emulation / HDFM / HDAM
    // Tube Emulation - enabled or sound
    //
    $('input[type=radio][name=tubeEm]').change(function() {
        if($('#tubeEmulation').is(':checked')) {
            //
            // update the new setting to enabled
            //
            tubeEmulation = tubeEms[TUBE_EM_ENABLED];
            setTubeEmulation(tubeEmulation);
        }
        else if($('#tubeSound').is(':checked')){
            //
            // update the new setting to sound
            //
            tubeEmulation = tubeEms[TUBE_EM_SOUND];;
            setTubeEmulation(tubeEmulation);
        }
    });
    //
    // HDFM
    //
    $('input[type=radio][name=hdFM]').change(function() {
        if($('#hdFM-enabled').is(':checked')) {
            //
            // update the new setting to enabled
            //
            hdFM = "Enabled";
            setHDFM(hdFM);
        }
        else if ($('#hdFM-disabled').is(':checked')) {
            //
            // update the new setting to disabled
            //
            hdFM = "Disabled";
            setHDFM(hdFM);
        }
    });
    //
    // HDAM
    //
    $('input[type=radio][name=hdAM]').change(function() {
        if($('#hdAM-enabled').is(':checked')) {
            //
            // update the new setting to enabled
            //
            hdAM = enablers[ENABLED];
            setHDAM(hdAM);
        }
        else if ($('#hdAM-disabled').is(':checked')) {
            //
            // update the new setting to disabled
            //
            hdAM = enablers[DISABLED];
            setHDAM(hdAM);
        }
    });
    //
    // initialize Sound Settings labels - is this redundant????????
    //
    $( "#treble" ).val( $( "#slider-treble" ).slider( "value" ) + "db");
    $( "#mid" ).val( $( "#slider-mid" ).slider( "value" ) + "db");
    $( "#bass" ).val( $( "#slider-bass" ).slider( "value" ) + "db");
    $( "#loudness" ).val( $( "#slider-loudness" ).slider( "value" ) + "db");
    $( "#subwoofer" ).val( $( "#slider-subwoofer" ).slider( "value" ) + "db");
    //*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*
    //
    // Data Management functions
    //
    //*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*
    //
    // Setters - update ui element to new value and also ad_fmr_config
    //
    function setTreble(newValue) {
        treble = newValue;
        ad_fmr_config[CONFIG_USER_SETTINGS+5]=newValue;
    }
    function setMid(newValue) {
        mid = newValue;
        ad_fmr_config[CONFIG_USER_SETTINGS+6]=newValue;
    }
    function setBass(newValue) {
        bass = newValue;
        ad_fmr_config[CONFIG_USER_SETTINGS+7]=newValue;
    }
    function setLoudness(newValue) {
        loudness = newValue;
        ad_fmr_config[CONFIG_USER_SETTINGS+8]=newValue;
    }
    function setSubwoofer(newValue) {
        subwoofer = newValue;
        //
        // 5-0 Subwoofer gain + / - 10dB, signed bits
        //
        var pv = ad_fmr_config[CONFIG_USER_SETTINGS+9];
        pv &= 0xC0;
        pv |= subwoofer;
        ad_fmr_config[CONFIG_USER_SETTINGS+9]=pv;
    }
    function setXfr(newValue) {
        xfr = newValue;
        //
        // 7-6 Xover frequency 0x0-55, 0x1-85, 0x2-120, 0x3-160
        //
        var pv = ad_fmr_config[CONFIG_USER_SETTINGS+9];
        pv = pv & 0x3F;  // assume 55 Hz
        if (xfr == xfrs[XFR_85HZ]) {
            pv = pv | 0x40;
        } else if (xfr == xfrs[XFR_120HZ]) {
            pv = pv | 0x80;
        } else if (xfr == xfrs[XFR_160HZ]) {
            pv = pv | 0xC0;
        }
        ad_fmr_config[CONFIG_USER_SETTINGS+9]=pv;
    }
    function setAutoVolume(newValue) {
        autoVolume = newValue;
        //
        // xor 0x1a
        //
        ad_fmr_config[CONFIG_USER_SETTINGS+4] = (autoVolume^0x1A);
    }
    function setAutoVolumeEnable(newValue) {
        autoVolumeEnable = newValue;
        if (autoVolumeEnable == "Enabled") {
            //
            // set bit 2 of byte 0
            //
            updateConfigBit(CONFIG_USER_SETTINGS, 2, SET_BIT);
        }
        else if (autoVolumeEnable == "Disabled") {
            //
            // clear bit 2 of byte 0
            //
            updateConfigBit(CONFIG_USER_SETTINGS, 2, CLEAR_BIT);

        } else {
            console.error(PROGRAM_ERROR + " in setAutoVolumeEnable");
        }
    }
    function setEqualizer(newValue) {
        equalizer = newValue;
        //
        // user settings byte 0 bit 0 - 1 --> Loudness enabled, 0 --> disabled
        //
        if (equalizer == "Loudness") {
            //
            // set bit 0 and clear bit 1 of byte 0
            //
            updateConfigBit(CONFIG_USER_SETTINGS, 0, SET_BIT);
            updateConfigBit(CONFIG_USER_SETTINGS, 1, CLEAR_BIT);
        } else if (equalizer == "EQ") {
            //
            // set bit 0 and set bit 1 of byte 0
            //
            updateConfigBit(CONFIG_USER_SETTINGS, 0, SET_BIT);
            updateConfigBit(CONFIG_USER_SETTINGS, 1, SET_BIT);
        } else if (equalizer == "Off") {
            //
            // clear bit 0 and 1 of byte 0
            //
            updateConfigBit(CONFIG_USER_SETTINGS, 0, CLEAR_BIT);
            updateConfigBit(CONFIG_USER_SETTINGS, 1, CLEAR_BIT);
        } else {
            console.error(PROGRAM_ERROR + " in setEqualizer");
        }
    }
    function setBalance(newValue) {
        balance = newValue;
        //
        // xor 0x7f
        //
        ad_fmr_config[CONFIG_USER_SETTINGS+1] = (newValue^0x7f);
    }
    function setFader(newValue) {
        fader = newValue;
        //
        // xor 0x7f
        //
        ad_fmr_config[CONFIG_USER_SETTINGS+2] = (newValue^0x7f);
    }
    function setTone(newValue) {
        tone = newValue;
        //
        // xor 0x7f
        //
        ad_fmr_config[CONFIG_USER_SETTINGS+3] = (newValue^0x7f);
    }
    function setTubeEmulation(newValue) {
        tubeEmulation = newValue;
        if (tubeEmulation == tubeEms[TUBE_EM_ENABLED]) {
            //
            // byte 0 bit 3 set bit 4 cleared
            //
            updateConfigBit(CONFIG_USER_SETTINGS, 4, CLEAR_BIT);
            updateConfigBit(CONFIG_USER_SETTINGS, 3, SET_BIT);
        }
        else if (tubeEmulation == tubeEms[TUBE_EM_SOUND]) {
            //
            // byte 0 bit 3 cleared bit 4 set
            //
            updateConfigBit(CONFIG_USER_SETTINGS, 3, CLEAR_BIT);
            updateConfigBit(CONFIG_USER_SETTINGS, 4, SET_BIT);
        }
    }
    function setHDFM(newValue) {
        hdFM = newValue;
        //
        // byte 0 bit 6 set bit --> enabled, clear bit --> disabled
        //
        if (hdFM == "Enabled") {
            updateConfigBit(CONFIG_USER_SETTINGS, 6, SET_BIT);
        } else { // disabled
            updateConfigBit(CONFIG_USER_SETTINGS, 6, CLEAR_BIT);
        }
    }
    function setHDAM(newValue) {
        hdAM = newValue;
        //
        // byte 0 bit 7 set bit --> enabled, clear bit --> disabled
        //
        if (hdAM == enablers[ENABLED]) {
            updateConfigBit(CONFIG_USER_SETTINGS, 7, SET_BIT);
        } else { // disabled
            updateConfigBit(CONFIG_USER_SETTINGS, 7, CLEAR_BIT);
        }
    }
    //*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*
    //
    // Utility functions
    //
    //*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*_*
    //
    // config array helper functions
    //
    function updateConfigBit(offset, bit, polarity) {
        var previousValue = ad_fmr_config[offset];
        if (polarity == CLEAR_BIT) {
            previousValue &= ~(1 << bit);
        }
        else { // SET_BIT
            previousValue |= (1 << bit);
        }
        ad_fmr_config[offset] = previousValue;
    }
    //
    // test if b0 - b7 is set in value
    //
    function isBitSet(value, bit) {
        return (value & (1 << bit));
    }
    function setBit(val, bit)
    {
        let newVal = val &= ~(1<<bit);
        newVal |= (1<<bit);
        return newVal;
    }
    function clrBit(val, bit)
    {
        let newVal = val &= ~(1<<bit);
        return newVal;
    }
    //
    // update all UI elements
    //
    function updateUIElements()
    {
        //
        // update all labels, sliders, etc
        //
        // Sound
        //
        $( "#treble" ).val( treble + "db");
        $( "#slider-treble" ).slider( "value", treble );
        $( "#mid" ).val( mid + "db");
        $( "#slider-mid" ).slider( "value", mid );
        $( "#bass" ).val( bass + "db");
        $( "#slider-bass" ).slider( "value", bass );
        $( "#loudness" ).val( loudness + "db");
        $( "#slider-loudness" ).slider( "value", loudness );
        $( "#subwoofer" ).val( subwoofer + "db");
        $( "#slider-subwoofer" ).slider( "value", subwoofer );
        $( "#xfr" ).val( xfr );
        $( "#xfr" ).selectmenu("refresh");
        //
        // Volume
        //
        $( "#autoVol" ).val( autoVolume + "db");
        $( "#slider-autoVol" ).slider( "value", autoVolume );
        $( "#autoVol" ).val( autoVolume + "db");
        if (autoVolumeEnable == "Enabled") {
            $( "#slider-autoVol" ).slider( "enable" );
            $( "#ave-enabled" ).prop( "checked", true ).checkboxradio('refresh');
            $( "#ave-disabled" ).prop( "checked", false ).checkboxradio('refresh');;
        }
        else {
            $( "#slider-autoVol" ).slider( "disable" );
            $( "#ave-enabled" ).prop( "checked", false ).checkboxradio('refresh');;
            $( "#ave-disabled" ).prop( "checked", true ).checkboxradio('refresh');;
        }
        if (equalizer == "Off") { // 'Off', 'Loudness', 'EQ'
            $( "#eq-off" ).prop( "checked", true ).checkboxradio('refresh');
            $( "#eq-loudness" ).prop( "checked", false ).checkboxradio('refresh');;
            $( "#eq-EQ" ).prop( "checked", false ).checkboxradio('refresh');;
        }
        else if (equalizer == "Loudness") {
            $( "#eq-off" ).prop( "checked", false ).checkboxradio('refresh');
            $( "#eq-loudness" ).prop( "checked", true ).checkboxradio('refresh');;
            $( "#eq-EQ" ).prop( "checked", false ).checkboxradio('refresh');;
        }
        else { // EQ
            $( "#eq-off" ).prop( "checked", false ).checkboxradio('refresh');
            $( "#eq-loudness" ).prop( "checked", false ).checkboxradio('refresh');;
            $( "#eq-EQ" ).prop( "checked", true ).checkboxradio('refresh');;
        }
        //
        // Balance / Fader /Tone
        //
        $( "#balance" ).val( balance + "db");
        $( "#slider-balance" ).slider( "value", balance );
        $( "#fader" ).val( fader + "db");
        $( "#slider-fader" ).slider( "value", fader );
        $( "#tone" ).val( tone + "db");
        $( "#slider-tone" ).slider( "value", tone );
        //
        // Tube Emulation / HDFM /HDAM
        //
        if (tubeEmulation == tubeEms[TUBE_EM_ENABLED]) {
            $( "#tubeEmulation" ).prop( "checked", true ).checkboxradio('refresh');
            $( "#tubeSound" ).prop( "checked", false ).checkboxradio('refresh');;
        }
        else {  // Sound
            $( "#tubeEmulation" ).prop( "checked", false ).checkboxradio('refresh');
            $( "#tubeSound" ).prop( "checked", true ).checkboxradio('refresh');;
        }
        if (hdFM == enablers[ENABLED]) {
            $( "#hdFM-enabled" ).prop( "checked", true ).checkboxradio('refresh');
            $( "#hdFM-disabled" ).prop( "checked", false ).checkboxradio('refresh');;
        }
        else {  // Disabled
            $( "#hdFM-enabled" ).prop( "checked", true ).checkboxradio('refresh');
            $( "#hdFM-disabled" ).prop( "checked", false ).checkboxradio('refresh');;
        }
        if (hdAM == enablers[ENABLED]) {
            $( "#hdAM-enabled" ).prop( "checked", true ).checkboxradio('refresh');
            $( "#hdAM-disabled" ).prop( "checked", false ).checkboxradio('refresh');;
        }
        else {  // Disabled
            $( "#hdAM-enabled" ).prop( "checked", true ).checkboxradio('refresh');
            $( "#hdAM-disabled" ).prop( "checked", false ).checkboxradio('refresh');;
        }
    }
    //
    // revert to factory defaults
    //
    function setFactoryDefaults()
    {
        //
        // update our configData array
        //
        setTreble(defaultTreble);
        setMid(defaultMid);
        setBass(defaultBass);
        setLoudness(defaultLoudness);
        setSubwoofer(defaultSubwoofer);
        setXfr(defaultXfr);
        setAutoVolume(defaultAutoVolume);
        setAutoVolumeEnable(defaultAutoVolumeEnable);
        setEqualizer(defaultEQ);
        setBalance(defaultBalance);
        setFader(defaultFader);
        setTone(defaultTone);
        setTubeEmulation(defaultTubeEmulation);
        setHDFM(defaultHDFM);
        setHDAM(defaultHDAM);
    }
    $('#dabSettingsContainer').on('click', function() {
        var boxes = $(":checkbox:checked");
        if (boxes.length > DAB_MAXIMUM_ACTIVE_STATIONS) {
        // if (boxes.length > 3) {
            //
            // alert user and uncheck the last box that the user tried to set
            // active
            //
            alert("You have exceeded the maximum allowable active stations");
            boxes[boxes.length-1].checked = false;
        }
    });
    //
    // this function is executed when the user clicks on the Submit button
    // in the DAB Settings tab
    //
    function dabSubmit() {
        $('.dabCB').each(function() {
            var ids = this.id;
            var bit = this.getAttribute("validBit");
            var offset = this.getAttribute("offset");
            //
            // for development
            //
            console.assert(LOGGER, ids + ' active: ' + this.checked + ', offset: '
            + offset + ', valid: ' + bit);
            //
            // update ad_fmr_config bit in question
            //
            updateConfigBit(offset, bit, CLEAR_BIT);
            if (this.checked) {
                updateConfigBit(offset, bit, SET_BIT);
            }
        });
        $('#dabSubmit').fadeTo("slow", 0.5);
    }
    function createCheckBox(active, ensembleNumber, stationNumber, srcIndex, validBit) {
        var dabID = ' ';
        var str = ' ';
        //
        // assemble our input checkbox DOM element
        //
        dabID = 'Ensemble'+ensembleNumber+'Station'+stationNumber;
        if (active == DAB_ACTIVE) {
            str += '<div> <input type="checkbox" class="dabCB" id="'+dabID+'" name="'
                +dabID+'" offset="'+srcIndex+'" validBit="'+validBit+'"checked>';
        }
        else {
            str += '<div> <input type="checkbox" class="dabCB" id="'+dabID+'" name="'
                +dabID+'" offset="'+srcIndex+'" validBit="'+validBit+'">';
        }
        str += '<label for="'+dabID+'">'+'Station '+stationNumber+'</label></div>';
        //
        // return content string to caller
        //
        return str;
    }
    //
    // <div id="dabSettingsContainer"> </div>
    //
    function parseDABsAndCreateDOMContent() {
        var dabBody='<div id="dabBody">';
        var dabContent=' ';
        var dabID=' ';
        let srcIndex, dabValue, ensembleNumber, stationNumber, active;
        //
        // initialize srcIndex to point to the first DAB Channel
        // and clear our ensemble and station number
        //
        srcIndex = CONFIG_DAB_CHANNELS;
        ensembleNumber = 0;
        stationNumber = 0;
        //
        // stay in loop below until we hit EOF or no more DAB Channels
        //
        while (srcIndex < ad_fmr_config[CONFIG_FILE_LENGTH]) {
            //
            // get current dab value
            //
            dabValue = ad_fmr_config[srcIndex];
            //
            // okay lets check out out new ensemble - here is the bit configurations:
            // b7 = 1
            //      b6 indicates station active
            //      b5 - b0 is the ensemble index
            // b7 = 0
            //      byte will contain 1 to 3 stations that match the ensemble
            //      the fill order is b5 down to b0 and there will be as many
            //      of these bytes as there are stations in the ensemble
            //      b6 = 0
            //      For the remaining bit pairs upper bit indicates station
            //      valid or not, lower bit indicates active or not
            //      b5:4
            //      b3:2
            //      b1:0
            //
            if (isBitSet(dabValue, 7)) {
                //
                // we have a new ensemble
                //
                ensembleNumber++;
                stationNumber = 1;
                active = isBitSet(dabValue, 6) ? DAB_ACTIVE : DAB_NOT_ACTIVE;
                //
                // for development - set LOGGER to false
                //
                console.assert(LOGGER, dabValue + ': ensembleNumber '
                     + ' station 1 ' + 'is ' + active);
                //
                // close previous ensemble and create dom content for new ensemble
                //
                dabContent += '</div>';
                if (ensembleNumber%2!=0)
                    dabContent+='<div class="column1of2">';
                else
                    dabContent+='<div class="column2of2">';
                dabContent += '<h3 id="settingsTitle">' + 'Ensemble ' + ensembleNumber + '</h3>';
                //
                // set unique ID for station checkbox & label and append content
                //
                dabContent += createCheckBox(active, ensembleNumber, stationNumber, srcIndex, 6);
                //
                // ensure that we do exceed the ensemble maximum
                //
                if (ensembleNumber > DAB_MAXIMUM_ENSEMBLES) {
                    alert("Maximum Ensembles exceeded!");
                    break;
                }
            }
            //
            // bit 7 is 0 - interrogate bit pairs
            //
            else {
                //
                // for development - set LOGGER to false
                //
                console.assert(LOGGER, dabValue + ': ensembleNumber '
                    + '  stations ensue');
                //
                // bits 5 & 4
                //
                if (isBitSet(dabValue, 5)) {    // is b5:4 valid?
                    //
                    // b5 set VALID station, is it active?
                    //
                    active = isBitSet(dabValue, 4) ? DAB_ACTIVE : DAB_NOT_ACTIVE;
                    stationNumber++;
                    //
                    // for development - set LOGGER to false
                    //
                    console.assert(LOGGER, dabValue + ': ensembleNumber '
                        + ensembleNumber + '  station ' + stationNumber
                        + ' is ' + active);
                    //
                    // add station checkbox
                    //
                    dabContent += createCheckBox(active, ensembleNumber, stationNumber, srcIndex, 4);
                }
                //
                // bits 3 & 2
                //
                if (isBitSet(dabValue, 3)) {    // is b3:2 valid?
                    //
                    // b3 set VALID station, is it active?
                    //
                    active = isBitSet(dabValue, 2) ? DAB_ACTIVE : DAB_NOT_ACTIVE;
                    stationNumber++;
                    //
                    // for development - set LOGGER to false
                    //
                    console.assert(LOGGER, dabValue + ': ensembleNumber '
                        + ensembleNumber + '  station ' + stationNumber
                        + ' is ' + active);
                    //
                    // add station checkbox
                    //
                    dabContent += createCheckBox(active, ensembleNumber, stationNumber, srcIndex, 2);
                }
                //
                // bits 1 & 0
                //
                if (isBitSet(dabValue, 1)) {    // is b1:0 valid?
                    //
                    // b1 set VALID station, is it active?
                    //
                    active = isBitSet(dabValue, 0) ? DAB_ACTIVE : DAB_NOT_ACTIVE;
                    stationNumber++;
                    //
                    // for development - set LOGGER to false
                    //
                    console.assert(LOGGER, dabValue + ': ensembleNumber '
                        + ensembleNumber + '  station ' + stationNumber
                        + ' is ' + active);
                    //
                    // add station checkbox
                    //
                    dabContent += createCheckBox(active, ensembleNumber, stationNumber, srcIndex, 0);
                }
            }
            //
            // process next dab value
            //
            srcIndex++;
        }
        dabContent += '</div>';
        dabBody += dabContent;
        dabBody += '</div>';
        $('#dabSettingsContainer').html(dabBody);
        $( "#dabSubmit" ).click(function() {
          dabSubmit();
        });
        $('#dabSubmit').fadeTo("slow", 1);
    }
    function createConfigTable() {
        var table_body = '<table border="1">';
        var cfgIndex, cfgByte;
        $('#configTableContainer').html(" ");
        //
        // create header
        //
        var number_of_rows = Math.ceil(ad_fmr_config[CONFIG_FILE_LENGTH]/10);
        var number_of_cols = 10;
        table_body +='<thead>';
        table_body +='<tr>';
        for(var th=0; th<number_of_cols; th++){
            table_body +='<td>';
            table_body += th;
            table_body += '</td>';
        }
        table_body +='</tr>';
        table_body +='</thead>';
        for(var i=0, cfgIndex=0; i<number_of_rows;i++){
          table_body+='<tr>';
          for(var j=0; j<number_of_cols; j++ ) {
              table_body +='<td title="' + cellToolTips[cfgIndex] + '">';
              cfgByte = ad_fmr_config[cfgIndex];
              if (typeof cfgByte === 'undefined') {
                  table_body += 'EOF';
              } else {
                  table_body += (cfgByte.toString(16).padStart(2, '0'));
              }
              table_body +='</td>';
              cfgIndex++;
          }
          table_body+='</tr>';
        }
        table_body+='</table>';
        $('#configTableContainer').html(table_body);
    }
    updateUIElements();
    //
    // set appropriate tab heightStyle and refresh
    //
    $( "#tabs" ).tabs({heightStyle: "fill"});
    $( "#tabs" ).tabs({ active: 0 }); // Make Setup tab active
    // $( "#tabs" ).tabs({ active: 1 }); // Make Basic Settings tab active for development
    $( "#tabs" ).tabs('refresh');
    $( "#tabs-4" ).tabs({
      hide: { effect: "explode", duration: 1000 }
    });
    $( "#tabs-4" ).tabs({
      show: { effect: "blind", duration: 800 }
    });

    $('#tabs').tabs({
        activate: function (event, ui) {
            var $activeTab = $('#tabs').tabs('option', 'active');
            if ($activeTab == TAB_SETUP) {
                $('li#selectConfigFile').fadeTo("slow", 1);
                $('li#setDefaults').fadeTo("slow", 1);
                $('li#saveConfigFile').fadeTo("slow", 1);
            } else if ($activeTab == TAB_DAB_SETTINGS) {
                document.querySelector('#dabSettingsContainer').innerHTML = '';
                parseDABsAndCreateDOMContent();
            }
            else if ($activeTab == TAB_CONFIG_DATA) {
                //
                // create and populate config table
                //
                createConfigTable();
            }
        }
    });
});
