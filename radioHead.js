$(function() {
    //
    // Common defines that make readability easier
    //
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
    //
    const CONFIG_BUFFER_SIZE = 100;
    var ad_fmr_config = new Uint8Array(CONFIG_BUFFER_SIZE);
    const CONFIG_OC_MAJOR_VERSION           = 0;
    const CONFIG_OC_MINOR_VERSION           = 1;
    const CONFIG_CALL_RESPONSE_LINK_VERSION = 2;
    const CONFIG_SERIAL_NUMBER              = 3;    // 10 bytes
    const CONFIG_FMR_HARDWARE_VERSION       = 13;
    const CONFIG_FMR_FIRMWARE_VERSION       = 14;
    const CONFIG_SETUP_SPEECH_ROM_VERSION   = 15;
    const CONFIG_SETUP_TABLE                = 16;
    const CONFIG_USER_SETTINGS              = 28;
    const CONFIG_DAB_SCAN_INDEX             = 38;
    const CONFIG_DAB_CHANNELS               = 39;   // 80 bytes
    const CONFIG_CHECKSUM                   = 119;
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
    // File I/O
    //
    var cfgFileName;
    //
    // config data cell tooltips - very nice touch for development
    //
    // NOTE:    BE VERY PARTICULAR WITH THE STRUCTURE - MODIFY AND/OR
    //          ADD A TOOL TIP AND TEST RIGHT AWAY!!!
    //
    var cellToolTips = [
        "option card major version\x0A\x0A"
            + "b7: 0-BTU 1-USB option card product name\x0A"
            + "b6-4: major version\x0A"
            + "b3-0: hardware version",
        "option card minor version\x0A\x0A"
            + "b7-0: minor version",
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
            + "b7-6 Xover Frequency 0x0-55, 0x1-85, 0x2-120, 0x3-160"
    ];
    //
    // initial setup - ensure we start with Factory Defaults
    //
    function setup() {
        setFactoryDefaults();
    }
    document.addEventListener("DOMContentLoaded", setup());
    //
    // Key Handlers for development/testing
    //
    document.addEventListener("keydown", function(event) {
        if (event.defaultPrevented) {
            return;
        }
        if (event.code === "ArrowDown"){
            // clear configuration array on "down" key press
            ad_fmr_config.fill(0x00, 0, ad_fmr_config.length);
        }
        if (event.code === "ArrowUp"){
            // set configuration array on "up" key press
            ad_fmr_config.fill(0xff, 0, ad_fmr_config.length);
        }
        if (event.code === "ArrowLeft"){
            // // "left" key press
            ad_fmr_config.fill(0x55, 0, ad_fmr_config.length);

        }
        if (event.code === "ArrowRight"){
            // "right" key press
            ad_fmr_config.fill(0xaa, 0, ad_fmr_config.length);
        }
    }, true);
    //
    // jQueryUI initializations - tabs, checkboxradio
    //
    $(function() {
        $("#tabs").tabs();
    });
    $( "input[type='radio']" ).checkboxradio();
    //
    // Setup
    // Configuration File
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
            for (n = 0; n < result.length; ++n) {
                ad_fmr_config[n] = result.charCodeAt(n);
            }
        }
    }
    const fileSelector = document.getElementById('read-file');
    fileSelector.addEventListener('change', (event) => {
        readFile(event.target);
    });
    $('li#selectConfigFile').on('click', function() {
        $(this).fadeTo("slow", 0.8);
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
        // console.log("save file name: " + cfgFileName );
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
            console.log(PROGRAM_ERROR + " in setAutoVolumeEnable");
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
            console.log(PROGRAM_ERROR + " in setEqualizer");
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
    /* Defining the tableCreate function */
    function tableCreate(rows, cols, data, thead, tfoot) {
        // 1) Create table and body elements
        let table = document.createElement('table');
        // let table = $('#configTableContainer');
        let tableBody = document.createElement('tbody');

        // 2) Optional header
        let headContent = document.createElement('thead');
        let tr = document.createElement('tr');

        // 2.1) Sets default behavior: Single cell header
        if (thead && Array.isArray(thead) == false) {
            let td = document.createElement('td');
            td.innerHTML = thead; // Set header text to argument input
            td.setAttribute('colspan', cols); // Span header for as many cols as table
            tr.append(td);
            headContent.append(tr); // append head row to thead element
            thead = headContent; // Make this final value of thead
        }
        // 2.2) If "split" is third argument: Creates a multi-cell header
        if (Array.isArray(thead)) {
            let i;
            for (i = 0; i < cols; i++) {
                let td = document.createElement('td');
                td.id = 'thead' + i;
                td.innerHTML = thead[i];
                tr.append(td); // append multiple td to head row
            }
            headContent.append(tr); // append head row to thead element
            thead = headContent; // Make this final value of thead
        }
        // 3) Optional footer (text is user input string)
        if (tfoot) {
            footElement = document.createElement('tfoot');
            tr = document.createElement('tr');
            td = document.createElement('td');
            td.innerHTML = tfoot; // Set text to fourth argument input
            td.setAttribute('colspan', cols);
            tr.append(td) // Append single cell to row
            footElement.append(tr); // Append row to tfoot element
            tfoot = footElement; // Make this final value of tfoot
        }
        // 4) Create table body rows and cell with loops
        let i;
        // var result, n, aByte, byteStr;
        for (i = 0; i < rows; i++) {
            //
            // Loop to create row
            //
            let tr = document.createElement('tr');
            let id = i * cols;
            //
            // Nested loop to append cells to rows (first loop id = 0*5;
            // second loop id = 1*5, etc)
            //
            for (j = 0; j < cols; j++) {
                let td = document.createElement('td');
                id++ // increase id by 1 (first loop is 0+1 = 1)
                if (id == i * cols + 1) {
                    td.classList.add('left-col');
                 }
                 //
                 // print id in col cell & set id of element to id
                 //
                 td.innerHTML = id;
                 td.setAttribute('id', 'cell' + id);
                 //
                 // set the tooltip and append the col cell to the table row
                 //
                 td.setAttribute('title', cellToolTips[id-1]);
                 tr.append(td);
                 // Repeats until j < column numbers entered by user

                 if (data) {
                     var byteStr;
                     byteStr = data[id - 1].toString(16);
                     if (byteStr.length < 2) {
                          byteStr = "0" + byteStr;
                     }
                     td.innerHTML = byteStr;
                 }
             }
             tableBody.append(tr);
        }

        // 5) Append head, body and footer
        if (thead) {
            table.append(thead);
        }
        table.append(tableBody);
        if (tfoot) {
            table.append(tfoot);
        }
        // console.log(table);
        return table;
    }
    updateUIElements();
    //
    // set appropriate tab heightStyle and refresh
    //
    $( "#tabs" ).tabs({heightStyle: "fill"});
    $( "#tabs" ).tabs({ active: 0 }); // Make Setup tab active
    // $( "#tabs" ).tabs({ active: 1 }); // Make Basic Settings tab active for development
    $( "#tabs" ).tabs('refresh');

    $('#tabs').tabs({
        activate: function (event, ui) {
            var $activeTab = $('#tabs').tabs('option', 'active');
            // console.log("Tab #"+ $activeTab);
            if ($activeTab == 0) {
                $('li#selectConfigFile').fadeTo("slow", 1);
                $('li#setDefaults').fadeTo("slow", 1);
                $('li#saveConfigFile').fadeTo("slow", 1);
            }
            if ($activeTab == 3) {
                const headings = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
                var cfgTable = tableCreate(10, 10, ad_fmr_config, headings, 'Aurora Design Kicks ASS!');
                document.querySelector('#configTableContainer').innerHTML = '';
                document.querySelector('#configTableContainer').appendChild(cfgTable);
            }
        }
    });
});
