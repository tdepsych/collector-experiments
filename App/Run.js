$.getScript("libraries/collector/redcap_dropped_fields.js");
project_json = {};
var home_dir;

var download_data_text = '<div id="card_container" style="width:100%;height:100%;display: flex;justify-content: center;align-items: center;text-align: center;flex-direction: column;">'+
'<div class="card" style="width: 30em;">'+
  '<div class="card-header text-primary"><h2>You have finished</h2></div>'+
  '<div class="card-body">'+
    '<p><b>Thank you for taking part in this study.</b><br><br> If you wish, you can download the data by clicking the button below. '+
    'It is advisable to do so in case any data transfer issues occured behind the scenes whilst you completed the study. '+
    'If you have saved your experimental data, you can be added to the final dataset, ensuring your time has not been wasted.'+
  '</div>'+
  '<div class="card-footer"><button class="btn btn-primary text-white" id="download_json">Download data</button></div>'+
'</div>'+
'</div>'

// This needs to be a global variable or Phase.add_response() cannot use it
parent.parent.start_date_time = new Date().toLocaleDateString("en-US").replaceAll("/","_") +"_" +new Date().toLocaleTimeString().replaceAll(":","_");
/*
 * Objects
 */

online_data_obj = {
  finished_and_stored: false,
  run_save: function () {
    var this_save = online_data_obj.save_queue.pop();
    this_save();
    if (online_data_obj.save_queue.length > 0) {
      //keep going until all saves done.
      online_data_obj.run_save();
    }
  },
  saves_started: 0,
  saves_ended: 0,
  save_queue: [],
  save_queue_add: function (save_queue_item) {
    online_data_obj.save_queue.push(save_queue_item);
    if (online_data_obj.save_queue.length === 1) {
      //need to initiate run_save as it stopped before you added this item
      online_data_obj.run_save();
    }
  },
};

Project = {
  activate_pipe: function () {
    var this_function = Project.pipeline.shift();
    if (
      (Project.resume === false) |
      (Project.start_functions.indexOf(this_function) === -1)
    ) {
      if (typeof this_function !== "undefined") {
        window[this_function]();
      }
    } else {
      Project.activate_pipe();
    }
  },
  get_vars: {},
  html_code: {},
  pipeline: [
    "detect_exe",
    "get_htmls",
    "get_gets",
    "start_restart", // {CGD} Turned this off a long time ago, can't really remember why! (Think it was something to do with a double page loading thing)
    "start_project",
    "load_phases",
    "select_condition",
    "full_screen",
    "create_project_json_variables",
    "parse_sheets",
    "parse_current_proc",
    "clean_phasetypes",
    "insert_start",
    "insert_end_checks",
    "shuffle_start_exp",
    "buffer_phases",
    "process_welcome",
  ],
  resume: false,

  // start functions are the functions required when NOT resuming
  start_functions: [
    "detect_exe",
    "create_project_json_variables",
    "parse_sheets",
    "parse_current_proc",
    "clean_phasetypes",
    "insert_start",
    "insert_end_checks",
    "shuffle_start_exp",
  ],

  /*
   * Phase functions
   */
  detect_context: function () {
    //turn to false to make use of eel and python
    if (document.URL.indexOf("localhost") !== -1) {
      if (
        typeof parent.dropbox_developer !== "undefined" &&
        parent.dropbox_developer === true
      ) {
        return "github";
      } else {
        return "localhost";
      }
    } else if (document.URL.indexOf("github.io") !== -1) {
      //assume it's github
      return "github";
    } else if (document.URL.indexOf("gitpod.io") !== -1) {
      return "gitpod";
    } else {
      return "server";
    }
  },
  finish_phase: function (go_to_info) {
    const highestId = window.setTimeout(() => {
      for (let i = highestId; i >= 0; i--) {
        window.clearInterval(i);
      }
    }, 0);
    phase_end_ms = new Date().getTime();
    parent.parent.phase_start_time_ms = phase_end_ms;
    phase_inputs = {};
    
    // $("#experiment_progress").css("width",(100 * project_json.phase_no) / (project_json.parsed_proc.length - 1) + "%");

    for (var i = 0; i < project_json.inputs.length; i++) {
      if ( $("input[name='" + project_json.inputs[i].name + "']:checked").length === 0 ) {
        phase_inputs[project_json.inputs[i].name] = project_json.inputs[i].value;
      } else {
        if (project_json.inputs[i].checked) {
          phase_inputs[project_json.inputs[i].name] = project_json.inputs[i].value;
        }
      }
    }

    this_proc = project_json.parsed_proc[project_json.phase_no];
    if (typeof project_json.parsed_stim[this_proc.item] === "undefined") {
      this_stim = {};
    } else {
      this_stim = project_json.parsed_stim[this_proc.item];
    }

    if (this_stim === null) {
      this_stim = {};
    }

    var objs = [project_json.this_phase, phase_inputs, this_proc, this_stim],
      response_data = objs.reduce(function (r, o) {
        Object.keys(o).forEach(function (k) {
          r[k] = o[k];
        });
        return r;
      }, {});
      
    var post_string = "post_" + project_json.post_no;

    response_data["location"] = Project.get_vars.location;

    if(typeof(Project.get_vars.redcap_id) !== "undefined"){
      response_data["redcap_id"] = Project.get_vars.redcap_id;
    }

    var org_repo_proj = project_json.location.split("/");

    response_data["organization"] = org_repo_proj[0];
    response_data["repository"] = org_repo_proj[1];

    /*
     * detect if the user is in fullscreen or not
     */
    response_data[post_string + "_screen_height"] = screen.height;
    response_data[post_string + "_screen_width"] = screen.width;

    if (window.innerHeight === screen.height) {
      response_data[post_string + "_fullscreen"] = true;
    } else {
      response_data[post_string + "_fullscreen"] = false;
    }

    response_data[post_string + "_window_inner_width"] = window.innerWidth;
    response_data[post_string + "_window_inner_height"] = window.innerHeight;

    response_data[post_string + "_us_date"] = new Date().toLocaleDateString("en-US");
    response_data[post_string + "_time"]     = new Date().toLocaleTimeString();
    response_data[post_string + "_timezone"] = Intl.DateTimeFormat().resolvedOptions().timeZone;

    response_data[post_string + "_phase_end_ms"] = phase_end_ms;
    response_data[post_string + "_rt_ms"] = phase_end_ms - response_data[post_string + "_phase_start_ms"];
    response_data[post_string + "_phase_end_date"] = new Date(parseInt(phase_end_ms, 10)).toString("MM/dd/yy HH:mm:ss");
    response_data.platform = window.navigator.platform;
    response_data.username = $("#participant_code").val();

    project_json.this_phase = response_data;
    response_data.participant_browser = parent.parent.participant_browser;
    if(parent.parent.project_json.repeat_no >= project_json.phase_no){
      response_data.phase_number = project_json.phase_no + 1;
    } else {
      response_data.phase_number = project_json.phase_no;
    }

    var not_final_phase = true;

    if (
      $("#phase" + project_json.phase_no)
        .contents()
        .children()
        .find("iframe").length ===
      project_json.post_no + 1
    ) {
      $("#phase" + project_json.phase_no).remove();
      project_json.responses.push(project_json.this_phase);
      if (
        (project_json.phase_no === project_json.parsed_proc.length - 1) &
        (typeof go_to_info === "undefined")
      ) {
        not_final_phase = false;
        final_phase();
      } else {
        if (typeof go_to_info !== "undefined") {
          project_json.this_phase = {};
          project_json.phase_no = parseFloat(go_to_info) - 1;
          // project_json.phase_no = parseFloat(go_to_info);
          project_json.post_no = 0;
          setTimeout(function () {
            var combined_phase_buffer = 
              parseFloat(project_json.this_condition.buffer) + 
              parseFloat(project_json.phase_no);
              console.log("Buffering from phase: "+project_json.phase_no + " to phase: " + combined_phase_buffer)
            for (var index = project_json.phase_no; index < combined_phase_buffer; index++) {
              write_phase_iframe(index);
            }
            console.log("Trying to start: "+go_to_info)
          },0);
        } else {
          project_json.this_phase = {};
          project_json.phase_no = parseFloat(project_json.phase_no) + 1;
          project_json.post_no = 0;
          setTimeout(function () {
            var this_index =
              parseFloat(project_json.phase_no) +
              parseFloat(project_json.this_condition.buffer) - 
              1;
            write_phase_iframe(this_index);
          },0);
        }
        setTimeout(() => {
          Project.start_post(go_to_info);
        }, 1);
      }
    } else {
      project_json.post_no++;
      var start_time = new Date().getTime();
      
      $("#phase" + project_json.phase_no)
        .contents()
        .children()
        .find("iframe")
        .hide();
      Project.start_post(go_to_info);
      project_json.this_phase["post_" + project_json.post_no + "_phase_start_ms"] = parent.parent.phase_start_time_ms;
      project_json.this_phase["post_" + project_json.post_no + "_phase_start_date"] = new Date(parseInt(start_time, 10)).toString("MM/dd/yy HH:mm:ss");
    }

    /*
    * save to redcap (if appropriate)
    */
    if(typeof(project_json.this_condition.redcap_url) !== "undefined"){

      var keys = Object.keys(response_data)
        // if (keys.includes("_pii_")) {
        if (keys.some(e => e.includes("_pii_"))) {
          for (let i = 0; i < keys.length; i++) {
            let field = keys[i]
            if (field.includes("_pii_")) {
              form_name = field.split("_pii", 1)[0]
              parent.parent.redcap_instrument = form_name;
            } else {
              //do nothing
            }
          }
        } else {
          parent.parent.redcap_instrument = "main";
          Object.keys(project_json.this_condition).forEach(function (condition_item) {
            response_data["condition_" + condition_item] = project_json.this_condition[condition_item];
          });
          
        }
        console.log("REDcap Instrument: " + parent.parent.redcap_instrument)
      var phase_responses = project_json.responses[project_json.responses.length-1];

      console.log("phase_responses");
      var this_location = project_json.location.split("/")[0].replaceAll("-","") + "_" + project_json.location.split("/")[1].replaceAll("-","");
      //phase_responses.location;
      /*
      * update all the keys to have the "location_" before them
      */

      var clean_phase_responses = {};

      Object.keys(phase_responses).forEach(function(old_key){
        clean_phase_responses[old_key] = phase_responses[old_key];
      });
      
      parent.parent.main_remove_fields.forEach(adjust_redcap_array)
        function adjust_redcap_array(field) {
          delete(clean_phase_responses[field]);
        };

       clean_phase_responses.record_id = phase_responses.username + "_" + parent.parent.start_date_time;

      if (parent.parent.project_json.repeat_no == null){
        clean_phase_responses['redcap_repeat_instance'] = parent.parent.project_json.phase_no;
        parent.parent.project_json.repeat_no = parent.parent.project_json.phase_no;
      } else {
        clean_phase_responses['redcap_repeat_instance'] = parent.parent.project_json.repeat_no;
      }
      
      clean_phase_responses['redcap_repeat_instrument'] = parent.parent.redcap_instrument;
      if (parent.parent.redcap_instrument != "main") {
        var field_name = parent.parent.redcap_instrument;
        clean_phase_responses[field_name +'_complete'] = 2;
        parent.parent.pii_remove_fields.forEach(adjust_redcap_array)
        function adjust_redcap_array(field) {
          delete(clean_phase_responses[field]);
        };
      }
      // console.log(clean_phase_responses) // Uncomment this if you want to see what variables are submitted during each phase.submit() call
      // this_location.toLowerCase();

      console.log("just before the ajax");

      function redcap_post(this_url,this_data,attempt_no){
        console.log("attempt number " + attempt_no);
        $.ajax({
          type: "POST",
          url: this_url,
          crossDomain: true,
          data: this_data,
          success: function(result){
            console.log("result");
            //console.log(result);
            if(result.toLowerCase().indexOf("error") !== -1 | result.toLowerCase().indexOf("count") === -1){
              attempt_no++;
              if(attempt_no > 2){
                bootbox.alert("⚠ <b class='text-danger'>WARNING</b> ⚠ <br><br>This data has not submitted, despite 3 attempts to do so. Please pause your participation and contact the researcher");
              } else {
                redcap_post(
                  this_url,
                  this_data,
                  attempt_no
                );
              }
            }
          }
        });
      };

      redcap_post(
        project_json.this_condition.redcap_url,
        clean_phase_responses,
        0
      );
      /*
      Object.keys(phase_responses).forEach(function(old_key){

        Object.defineProperty(
          phase_responses,
          this_location + "_" + old_key,
          Object.getOwnPropertyDescriptor(
            phase_responses,
            old_key
          )
        );
        delete phase_responses[old_key];
      });
      */


      /*
      console.log("just before the ajax");
      $.ajax({
        type: "POST",
        url: project_json.this_condition.redcap_url,
        crossDomain: true,
        data: clean_phase_responses,
        success: function(result){
          console.log("result");
          // console.log(result);
          //Phase.submit();
        }
      });
      */

      // Finally, let's just update the repeat instance number
      parent.parent.project_json.repeat_no++;
      console.log("this is row number: " + parent.parent.project_json.repeat_no)
    }
    //
    // Saving Local Data Now
    //
    switch (Project.get_vars.platform) {
      case "localhost":
        var data_response = CElectron.fs.write_data(
          Project.get_vars.location,
          $("#participant_code").val() +
            "_" +
            $("#completion_code").val() +
            ".csv",
          Papa.unparse(Collector.complete_csv(project_json.responses), {
            quotes: false, //or array of booleans
            header: true,
            skipEmptyLines: true, //or 'greedy',
          })
        ); //the data
        if (data_response !== "success") {
          bootbox.alert(
            "Tell the researcher that saving data is broken:" + data_response
          );
        }
        break;
      case "github":
      case "simulateonline":
      case "server":
        if (not_final_phase) {
          online_data_obj.save_queue_add(function () {
            online_save(
              Project.get_vars.location,
              $("#participant_code").val(),
              $("#completion_code").val(),
              $("#prehashed_code").val(),
              JSON.stringify(
                encrypt(
                  project_json.public_key,
                  JSON.stringify([
                    project_json.responses[project_json.responses.length - 1],
                  ])
                )
              ), //data
              project_json.storage_scripts,
              function () {},
              "phase",
              project_json.responses.length - 1
            );
          });
        }
        break;
      case "preview":
      case "onlinepreview":
        //do nothing - you are not meant to be saving;
        break;
    }
  },
  generate_phase: function (phase_no, post_no) {
    if (typeof project_json.parsed_proc[phase_no] === "undefined") {
      return false;
    }

    post_no = post_no === 0 ? "" : "post " + post_no + " ";
    this_proc = project_json.parsed_proc[phase_no];
    var code_location =
      project_json.phasetypes[this_proc[post_no + "phasetype"]];
    this_phase = project_json.phasetypes[this_proc[post_no + "phasetype"]];


    //look through all variables and replace with the value

    /*
     * Create input to store the number of focus and blur events for the window, and store these using javascript
     */
    this_phase +=
      $("<input>")
        .attr("name", "window_switch")
        .css("display", "none")
        .prop("id", "window_switch")[0].outerHTML +
      $("<script>").html(
        "window.addEventListener('blur', function(){ var focus_val = $('#window_switch').val();  $('#window_switch').val(focus_val + 'leave-' + (new Date()).getTime() + ';')}); window.addEventListener('focus', function(){ var focus_val = $('#window_switch').val(); $('#window_switch').val(focus_val + 'focus-' + (new Date()).getTime() + ';')}); "
      )[0].outerHTML;


    //baseline_time

    this_phase =
      `<script> Phase = {}; Phase.phase_no = '${phase_no}'; Phase.post_no ='${post_no}' </script><script src = 'PhaseFunctions.js' ></script>${this_phase}`; //; phase_script +

    this_phase = this_phase.replace("[phase_no]", phase_no);
    this_phase = this_phase.replace("[post_no]", post_no);

    if(this_proc.item.toString() === "") {
      bootbox.alert("ERROR: If it's 'White Screening' it's because you've got an incorrect or empty row in the 'Item' column of your procedure sheet!<br><br><em>(ps. I spent hours trying to debug Collector when this happened to me as I hadn't realised it was just a missing 0 which is why I'm writing this long error message, so if it happens again I can fix it in seconds! CD)</em>")
    }
    if (this_proc.item.toString() !== "0") {
      this_stim = project_json.parsed_stim[this_proc.item];
      variable_list = Object.keys(this_proc).concat(Object.keys(this_stim));
    } else {
      variable_list = Object.keys(this_proc);
    }
    variable_list = variable_list.filter(String);

    //list everything between {{ and }} and transform them into lowercase
    split_phasetype = this_phase.split("{{");
    split_phasetype = split_phasetype.map(function (split_part) {
      if (split_part.indexOf("}}") !== -1) {
        more_split_part = split_part.split("}}");
        more_split_part[0] = more_split_part[0].toLowerCase();
        split_part = more_split_part.join("}}");
      }
      return split_part;
    });
    this_phase = split_phasetype.join("{{");

    variable_list.forEach(function (variable, this_index) {
      if (typeof this_proc[variable] !== "undefined") {
        variable_val = this_proc[variable];
      } else if (
        typeof this_stim !== "undefined" &&
        typeof this_stim[variable] !== "undefined"
      ) {
        variable_val = this_stim[variable];
      } else {
        if (typeof this_stim !== "undefined") {
          console.dir("Not sure whether this means there's a bug or not");
          //bootbox.alert("serious bug, please contact researcher about missing variable");
        }
      }
      this_phase = this_phase.replaceAll("{{" + variable + "}}", variable_val);
    });
    // in case the user forgets
    this_phase = this_phase.replaceAll("www.dropbox", "dl.dropbox");
    
    /*
     * Need to detect whether localhost and on mac
     */

    if (
      typeof CElectron !== "undefined" &&
      window.navigator.platform.toLowerCase().indexOf("mac") !== -1
    ) {
      this_phase = this_phase.replaceAll("../User/", home_dir + "/User/");
    } else if (Project.is_exe) {
      this_phase = this_phase.replaceAll("../User/", home_dir + "/User/");
    }
    return this_phase;
    
  },

  go_to: function (go_to_info) {
    // The Phase.go_to() function allows a user to jump forward/back a set number of phases or to a specific phase of their choice
    // It can be useful when you need to have participants restart trials based on task performance or branch participant based on responses

    // Leave this console.log live, it wont run unless you use the Phase.go_to() function, but it's very useful if you do to work out specific row numbers if including stimuli trials
    console.log(project_json.parsed_proc)

    var proc_length = project_json.parsed_proc.length
    if (go_to_info === 0 || go_to_info > (proc_length - 1)) {
      bootbox.alert("Please let the researcher know the study is attempting to move beyond bounds and cannot continue");
    } else {

      var goTo_input = go_to_info;
      
      if (typeof go_to_info == "string") {
        console.log("They inputted a string with a +/-");
        if (goTo_input.indexOf('+') != -1) {
          // this is employed when people ask to move forward via a +
          goTo_input = goTo_input.replace('+', '');
          console.log("The asked to move forward: " + goTo_input + " phases")  
          go_to_info = (project_json.phase_no + 1) + parseInt(goTo_input);
        } else {
          // this is employed when people ask to move back via a -
          goTo_input = goTo_input.replace('-', '');
          console.log("The asked to move back: " + goTo_input + " phases")  
          go_to_info = (project_json.phase_no + 1) - parseInt(goTo_input);
        } 
      } else  {
        // this allows people to select a specific procedure procedure row number to load
        console.log("They inputted a number");
        console.log("They want to go to phase: " + go_to_info)  
      } 
      console.log("Jumping to phase: " + go_to_info)
      Project.finish_phase(go_to_info);
    }
  },

  start_post: function (go_to_info) {
    // use the phase_progress column 
    
    if(typeof(project_json.this_condition.progress_bar) !== "undefined"){
      if(project_json.this_condition.progress_bar == "off"){
        $("#project_progress_bar").css("display","none");
      } else if(project_json.parsed_proc[project_json.phase_no].no_progress === "yes"){
        $("#project_progress_bar").css("display","none");
      } else if(project_json.this_condition.progress_bar == "phase" | project_json.this_condition.progress_bar == "trial" | project_json.this_condition.progress_bar == "stimuli" | project_json.this_condition.progress_bar == "item"){
        $("#project_progress_bar").css("display","flex");
        $("#experiment_progress").css("width",(100 * project_json.phase_no) / (project_json.parsed_proc.length - 1) + "%");
      } else  if(project_json.this_condition.progress_bar == "row" | project_json.this_condition.progress_bar == "procedure"){
        $("#project_progress_bar").css("display","flex");
        $("#experiment_progress").css("width",(100 * project_json.parsed_proc[project_json.phase_no].phase_progress) + "%"); 
        // the default is to have a progress bar, but for it to move on after each row of the spreadsheet, not after each phase.  
      } else {
        $("#project_progress_bar").css("display","flex");
        $("#experiment_progress").css("width",(100 * project_json.parsed_proc[project_json.phase_no].phase_progress) + "%");
      }
      // the default is to have a progress bar, but for it to move on after each row of the spreadsheet, not after each phase.
    } else {
      $("#project_progress_bar").css("display","flex");
      $("#experiment_progress").css("width",(100 * project_json.parsed_proc[project_json.phase_no].phase_progress) + "%");

    }

    if (typeof go_to_info !== "undefined") {
      project_json.phase_no = project_json.phase_no;
      console.log("phase.go_to: "+ project_json.phase_no)
    }
    console.log("phase.submit: "+ project_json.phase_no)
    if (typeof project_json.responses[project_json.phase_no] === "undefined") {
      project_json.responses[project_json.phase_no] = {};
    }
    if (
      $("#phase" + project_json.phase_no)
        .contents()
        .children().length > 0
    ) {
      var this_post_iframe = $("#phase" + project_json.phase_no)
        .contents()
        .children()
        .find("iframe")
        .filter(function (element) {
          return element === project_json.post_no;
        })[0];
      this_post_iframe.style.visibility = "visible";

      /*
       * apply zoom
       */
      var these_iframes = document
        .getElementById("phase" + project_json.phase_no)
        .contentWindow.document.getElementsByClassName("post_iframe");

      $("#phase" + project_json.phase_no)
        .contents()
        .find(".post_iframe")
        .contents()
        .find("body")
        .prepend('<button style="opacity:0; filter: alpha(opacity=0)" id="keyresponse_autofocus"></button>') // {CGD} Do not move, needs to prepend displayed HTML or autofocus scrolls to bottom on load
        .css("transform-origin", "top");

      try {
        for (var i = 0; i < these_iframes.length; i++) {
          var this_iframe = these_iframes[i];
          this_iframe_style = this_iframe.contentWindow.document.body.style;
          this_iframe_style.zoom = parent.parent.current_zoom;

          if (isFirefox) {
            this_iframe_style.width = (window.innerWidth * 0.98) / parent.parent.current_zoom;  // {CGD} adjusted all width/height to just under fullscreen to counter scroll bar issue
            this_iframe_style.height = (window.innerHeight * 0.98)  / parent.parent.current_zoom;
            this_iframe_style.maxWidth = (window.innerWidth * 0.97) / parent.parent.current_zoom;
            this_iframe_style.maxHeight = (window.innerHeight * 0.97)  / parent.parent.current_zoom;
            $("#phase" + project_json.phase_no).contents().find(".post_iframe").contents()
            .find("#container").css("transform", "scale(" + parent.parent.current_zoom + ")");
          } else {
            this_iframe_style.width = "100%";
            this_iframe_style.height = "100%";
          }
        }
      } catch (error) {
        //lazy fix for now
      }

      $("#phase" + project_json.phase_no).css("display", "inline-block");
      $("#phase" + project_json.phase_no).css("width", "100%");
      $("#phase" + project_json.phase_no).css("height", "100%");
      $("#phase" + project_json.phase_no).css("visibility", "visible");
      $("#phase" + project_json.phase_no) 
        .contents()
        .find("#post" + project_json.post_no)
        .contents()
        .find("#keyresponse_autofocus") //.append("<input type='hidden' name='complete' value='0' />") // {CGD} used to set REDCap completion value so records are green on data input
        .focus() //or anything that no-one would accidentally create.
        .css('outline', 'none');

      //detect if max_time exists and start timer
      var post_val;
      if (project_json.post_no === 0) {
        post_val = "";
      } else {
        post_val = "post " + project_json.post_no + " ";
      }
      var max_time;
      if (typeof project_json.parsed_proc[project_json.phase_no][post_val + "max_time"] === "undefined") {
        max_time = "user";
      } else {
        max_time = project_json.parsed_proc[project_json.phase_no][post_val + "max_time"];
      }
      if ((max_time !== "") & (max_time.toLowerCase() !== "user")) {
        var this_phase_no = project_json.phase_no;
        var this_post_no = project_json.post_no;
        Project.phase_timer = new Collector.timer(function () {
          if (this_phase_no === project_json.phase_no && this_post_no === project_json.post_no) {
            project_json.inputs = jQuery("[name]");
            Project.finish_phase();
          }
        }, parseFloat(max_time) * 1000);
      }
      participant_backup();

      var this_timeout = project_json.time_outs.filter(function (row) {
        return parseFloat(row.phase_no) === parseFloat(project_json.phase_no);
      });

      if (this_timeout.length !== 0) {
        //should have  && this_timeout.length == 1 - need to deal with when there are multiple
        this_timeout.forEach(function (spec_timeout) {
          setTimeout(function () {
            spec_timeout.this_func();
          }, spec_timeout.duration);
        });
      } else {
        //no timers on this phase?
      }
    }
    project_json.this_phase["post_" + project_json.post_no + "_phase_start_ms"] = new Date().getTime();
  },
};

/*
 * Functions
 */

function buffer_phases() {
  var this_buffer = project_json.this_condition.buffer;
  var phase_no = project_json.phase_no;
  for (var index = phase_no; index < phase_no + this_buffer; index++) {
    write_phase_iframe(index);
  }
  if (phase_no >= project_json.parsed_proc.length) {
    $("#project_div").html(
      "<h1>You have already completed this experiment</h1>"
    );
  }
  Project.activate_pipe();
}

function cancelFullscreen() {
  if (document.cancelFullScreen) {
    document.cancelFullScreen();
  } else if (document.mozCancelFullScreen) {
    document.mozCancelFullScreen();
  } else if (document.webkitCancelFullScreen) {
    document.webkitCancelFullScreen();
  }
}

function clean_this_condition(this_cond) {
  this_cond.download = clean_var(this_cond.download, "on");
  this_cond.participant_id = clean_var(this_cond.participant_id, "on");
  if (typeof this_cond.buffer === "undefined") {
    this_cond.buffer = 5;
  }
  return this_cond;
}

function clean_phasetypes() {
  project_json.parsed_proc = project_json.parsed_proc.map(function (row) {
    row.phasetype = row.phasetype.toLowerCase();
    return row;
  });

  Project.activate_pipe();
}

function clean_var(this_variable, default_value) {
  if (typeof this_variable === "undefined") {
    this_variable = default_value;
  } else {
    this_variable = this_variable.toLowerCase();
  }
  return this_variable;
}

function create_project_json_variables() {
  if (typeof project_json.phase_no === "undefined") {
    project_json.this_phase = {};
    project_json.uninitiated_stims = [];
    project_json.uninitiated_stims_sum = 0;
    project_json.initiated_stims = 0;
    project_json.time_outs = [];
    project_json.inputs = [];
    project_json.progress_bar_visible = true; //not doing anything at the moment
    project_json.phase_no = 0;
    project_json.phase_resp_no = 0;
    project_json.post_no = 0;
    if (typeof project_json.responses === "undefined") {
      project_json.responses = [];
    }
  }

  Project.activate_pipe();
}

function detect_exe() {
  $.get("../User/master.json", function (result) {
    Project.is_exe = false;
    Project.activate_pipe();
  }).catch(function (error) {
    Project.is_exe = true;
    Project.activate_pipe();
  });
}
function final_phase() {
  switch (Project.get_vars.platform) {
    case "github":
    case "simulateonline":
    case "server":
      /*
      online_data_obj.save_queue_add(function () {
        online_save(
          Project.get_vars.location,
          $("#participant_code").val(),
          $("#completion_code").val(),
          $("#prehashed_code").val(),
          JSON.stringify(
            encrypt(
              //the public key
              project_json.public_key,
              //the data
              JSON.stringify(project_json.responses)
            )
          ),
          project_json.storage_scripts,
          function (returned_data) {
            message_data = returned_data.split(" encrypted data = ");
            if (message_data.indexOf("error") !== -1) {
              //retrieve researcher e-mail address
              precrypted_data(
                project_json,
                "Problem encrypting: <b>" +
                  message_data +
                  "</b>, we'll try again every 10 seconds, but in case it fails, please download and e-mail this file. What do you want to save this file as? (you will get this message each time we fail to e-mail your data to the researcher)"
              );
              setTimeout(function () {
                final_phase();
              }, 10000);
            } else {
              $("#participant_country").show();
              $("#participant_country").load("ParticipantCountry.html");

              encrypted_data = message_data[1];

              $("#project_div").html(
                "<h1 class='text-primary'>" +
                  message_data[0] +
                  " <br><br> You can download the encrypted version of your data <span id='encrypt_click' class='text-success'>here</span> <br><br>or an unencrypted version <span id='raw_click' class='text-success'>here</span></h1>"
              );

              $("#encrypt_click").on("click", function () {
                bootbox.prompt({
                  title: "What do you want to save this file as?",
                  value: $("#participant_code").val() + "_encrypted.txt",
                  callback: function (result) {
                    var blob = new Blob([encrypted_data], { type: "text/csv" });
                    if (window.navigator.msSaveOrOpenBlob) {
                      window.navigator.msSaveBlob(blob, result);
                    } else {
                      var elem = window.document.createElement("a");
                      elem.href = window.URL.createObjectURL(blob);
                      elem.download = result;
                      document.body.appendChild(elem);
                      elem.click();
                      document.body.removeChild(elem);
                    }
                  },
                });
              });
              $("#raw_click").on("click", function () {
                precrypted_data(
                  project_json,
                  "What do you want to save this file as?"
                );
              });
              online_data_obj.finished_and_stored = true;
            }
          },
          "all",
          project_json.responses.length
        );
      });
      */
      download_at_end = project_json.this_condition.download_at_end;
      if (download_at_end === undefined) {
        download_at_end = "on";
      }
      if (
        typeof project_json.this_condition.end_message !== "undefined" &&
        project_json.this_condition.end_message !== ""
      ) {
        $("#project_div").html("<h3 class='text-primary'>" +project_json.this_condition.end_message +"</h3>");
      } else {
        $("#project_div").html("");
      }
      $("#project_div").append("<div id='download_div'></div>");

      if (download_at_end === "on") {
        $("#download_div").html(download_data_text
          // "<h3 class='text-primary'><h1>Thank you for participating. If you'd like to download your raw data <span id='download_json'>click here</span></h1></h3>"
        );
        $("#download_json").on("click", function () {
          precrypted_data(project_json, "What do you want to save this file as?");
        });
      } else if (download_at_end === "off") {
        $("#download_div").html(""
          /*
          "<h1 class='text-danger'>" +
            "<h3 class='text-primary'>If you would like to save your data (e.g. for your interest or as a back-up) press CTRL-S and you should be able to directly download your data.</h3>"
          */
        );
      }
      if(typeof(project_json.this_condition.sona_url) !== "undefined"){
        if(typeof(Project.get_vars.sona_id) === "undefined"){
          bootbox.alert("There seems to be a problem with how the researcher has set up the connection FROM SONA to Collector. Please tell them to include '&sona_id=%SURVEY_CODE%' towards the end of the URL.");
        } else {
          $("#download_div").append(
            $("<div>")
              .html("You can now return to SONA by clicking <a href='" + project_json.this_condition.sona_url + "&sona_id=" + Project.get_vars.sona_id + "' id='sona_link' target='_blank'>here</a>")
          );
        }
      }
      function online_save_check() {
        setTimeout(function () {
          if (online_data_obj.saves_started <= online_data_obj.saves_ended) {
            online_data_obj.finished_and_stored = true;
            $("#google_progress").css("width", "100%");
            setTimeout(function () {
              if (typeof project_json.this_condition.forward_at_end !== "undefined" && project_json.this_condition.forward_at_end !== "") {
                bootbox.alert("The researcher would like you to now go to " + project_json.this_condition.forward_at_end + " please copy the link into a new window to proceed there.");
              }
              $("#project_div").html(download_data_text
                // "<h1>Thank you for participating. If you'd like to download your raw data <span id='download_json'>click here</span></h1>"
              );
              $("#download_json").on("click", function () {
                precrypted_data(project_json, "What do you want to save this file as?");
              });
              //$("#participant_country").show();
              //$("#participant_country").load("ParticipantCountry.html");
              window.localStorage.removeItem("project_json");
              window.localStorage.removeItem("username");
              window.localStorage.removeItem("completion_code");
              window.localStorage.removeItem("prehashed_code");
            }, 1000);
          } else {
            var google_prog_perc =
              (100 * online_data_obj.saves_ended) /
                online_data_obj.saves_started +
              "%";
            $("#google_progress").css("width", google_prog_perc);
            online_save_check();
          }
        }, 1000);
      }
      $("#download_json").on("click", function () {
        precrypted_data(
          project_json,
          "What do you want to save this file as?"
        );
      });
      //online_save_check();
      break;
    case "localhost":
    case "preview":
    case "onlinepreview":
      online_data_obj.finished_and_stored = true;
      $("#project_div").html(download_data_text);
      $("#download_json").on("click", function () {
        precrypted_data(project_json, "What do you want to save this file as?");
      });
      window.localStorage.removeItem("project_json");
      window.localStorage.removeItem("username");
      window.localStorage.removeItem("completion_code");
      window.localStorage.removeItem("prehashed_code");
      break;
  }
}
function full_screen() {
  if (typeof project_json.this_condition.fullscreen !== "undefined") {
    if (project_json.this_condition.fullscreen === "on") {
      var elem = $(document.body);

      if (
        window.fullScreen ||
        (window.innerWidth === screen.width &&
          window.innerHeight === screen.height)
      ) {
        // don't need to ask
      } else {
        bootbox.confirm(
          "The researcher would like to run this in full screen, are you okay with that?",
          function (response) {
            if (response) {
              requestFullScreen(document.documentElement);
            }
          }
        );
      }
    }
  }
  Project.activate_pipe();
}

//solution to retrieve get values from url by weltraumpirat at https://stackoverflow.com/questions/5448545/how-to-retrieve-get-parameters-from-javascript/5448635#5448635
function get_gets() {
  function transformToAssocArray(prmstr) {
    var params = {};
    var prmarr = prmstr.split("&");
    for (var i = 0; i < prmarr.length; i++) {
      var tmparr = prmarr[i].split("=");
      params[tmparr[0]] = tmparr[1];
    }
    return params;
  }
  var prmstr = window.location.search.substr(1);
  Project.get_vars = prmstr !== null && prmstr !== "" ? transformToAssocArray(prmstr) : {};

  // maybe the following is left over from the simulator?
  if (typeof Project.get_vars.name !== "undefined") {
      exp_condition = Project.get_vars.name;
  } else {
    exp_condition = "";
  }
  if (Project.get_vars.platform === "preview") {
    online_data_obj.finished_and_stored = true;
  }
  Project.activate_pipe();
}

function get_htmls() {
  var htmls = [
    {
      name: "Timer",
      path: "libraries/collector/Timer.html",
    },
  ];

  /*
  project_json.code should loop through phasetypes and get them from the PhaseTypes folder. This location will depend on whether this is on the researcher's computer or not...
  */

  function loop_htmls(html_list) {
    var this_html = html_list.pop();
    $.get(this_html.path, function (this_code) {
      Project.html_code[this_html.name] = this_code;
      if (html_list.length > 0) {
        loop_htmls(html_list);
      } else {
        Project.activate_pipe();
      }
    });
  }
  loop_htmls(htmls);
}

function insert_end_checks() {
  if (
    Project.get_vars.platform === "preview" ||
    (typeof project_json.this_condition.skip_quality !== "undefined" &&
      project_json.this_condition.skip_quality.toLowerCase() === "yes")
  ) {

  } else {

    var this_proc = project_json.parsed_proc;
    var this_proc_end = {
      item: 0,
      max_time: "",
      text: "",
      phasetype: "end_checks_experiment",
    };
    var shuffle_levels = Object.keys(project_json.parsed_proc[0]).filter(
      (item) => item.indexOf("shuffle") !== -1
    );
    shuffle_levels.forEach(function (shuffle_level) {
      this_proc_end[shuffle_level] = "off";
    });

    this_proc.push(this_proc_end);

  }
  Project.activate_pipe();
}

function insert_start() {
  function add_to_start(current_procedure, phasetype) {
    var this_phase_info = {
      item: 0,
      max_time: "",
      text: "",
      phasetype: phasetype,
    };
    var shuffle_levels = Object.keys(project_json.parsed_proc[0]).filter((item) => item.indexOf("shuffle") !== -1);
    shuffle_levels.forEach(function (shuffle_level) {
      this_phase_info[shuffle_level] = "off";
    });
    current_procedure.unshift(this_phase_info);
    return current_procedure;
  }

  function load_quality_checks(quality_list) {
    var this_check = quality_list.pop();
    $.get(this_check.url, function (this_check_html) {
      project_json.phasetypes[this_check.name] = this_check_html;
      if (quality_list.length > 0) {
        load_quality_checks(quality_list);
      } else {
        Project.activate_pipe();
      }
    });
  }

  if (Project.get_vars.platform === "preview") {
    console.log("We're previewing the experiment!")
    if (typeof project_json.this_condition.redcap_url !== "undefined") {
      console.log("Switching off REDCap to avoid sending data.")
      project_json.this_condition.redcap_url = "";
    } else {
      //skipp this
    }
  }

  var this_proc = project_json.parsed_proc;
  if (Project.get_vars.platform === "preview" || (typeof project_json.this_condition.skip_quality !== "undefined" && project_json.this_condition.skip_quality.toLowerCase() === "yes")) {
    this_proc = add_to_start(this_proc, "quality_preview_start");
    load_quality_checks([
      {
        url: "Quality/PreviewStart.html",
        name: "quality_preview_start",
      },
    ]);
  } else {

    /*
     * These quality checks are in reverse order
     */


    var qualityChecks = project_json.this_condition.quality_checks;
    var qualityChecksArray = qualityChecks.split(',');


    // Define the desired order of checks
    var orderedChecks = ['sensitive_data', 'participant_commitment', 'age_check', 'avc_audio', 'avc_video', 'avc_both', 'bot_check', 'zoom_level'];

    // Iterate over the orderedChecks array
    $.each(orderedChecks, function(index, check) {
        if (qualityChecksArray.includes(check)) {
            switch (check) {
                case 'bot_check':
                    this_proc = add_to_start(this_proc, "quality_bot_check");
                    break;
                case 'avc_audio':
                    parent.parent.audio_visual = "audio";
                    this_proc = add_to_start(this_proc, "quality_audio_visual");
                    break;
                case 'avc_video':
                    parent.parent.audio_visual = "video";
                    this_proc = add_to_start(this_proc, "quality_audio_visual");
                    break;
                case 'avc_both':
                    parent.parent.audio_visual = "both";
                    this_proc = add_to_start(this_proc, "quality_audio_visual");
                    break;
                case 'zoom_level':
                    this_proc = add_to_start(this_proc, "quality_calibration_zoom");
                    break;
                case 'sensitive_data':
                    this_proc = add_to_start(this_proc, "quality_details_warning");
                    break;
                case 'age_check':
                    this_proc = add_to_start(this_proc, "quality_age_check");
                    break;
                case 'participant_commitment':
                    this_proc = add_to_start(this_proc, "quality_participant_commitment");
                    break;
                default:
                    console.log("No specific action for " + check);
            }
        }
    });

    // Start with the welcome message
    if (typeof project_json.this_condition.welcome !== 'undefined') {
      parent.parent.welcome_message = project_json.this_condition.welcome;
      this_proc = add_to_start(this_proc, "quality_welcome_message");   
    }



    // if (typeof project_json.this_condition.audio_visual !== "undefined" && project_json.this_condition.audio_visual.toLowerCase() === "no") {
    //   //skip this
    // } else if (typeof project_json.this_condition.audio_visual !== "undefined" && project_json.this_condition.audio_visual.toLowerCase() === "audio") {
    //   parent.parent.audio_visual = "audio";
    //   this_proc = add_to_start(this_proc, "quality_audio_visual");
    // } else if (typeof project_json.this_condition.audio_visual !== "undefined" && project_json.this_condition.audio_visual.toLowerCase() === "video") {
    //   parent.parent.audio_visual = "video";
    //   this_proc = add_to_start(this_proc, "quality_audio_visual");
    // } else {
    //   parent.parent.audio_visual = "both";
    //   this_proc = add_to_start(this_proc, "quality_audio_visual");
    // }

    // if (typeof project_json.this_condition.bot_check !== "undefined" && project_json.this_condition.bot_check.toLowerCase() === "no") {
    //   //skip this
    // } else {
    //   this_proc = add_to_start(this_proc, "quality_bot_check");
    // }

    // if (typeof project_json.this_condition.zoom_check !== "undefined" && project_json.this_condition.zoom_check.toLowerCase() === "no") {
    //   //skip this
    // } else {
    //   this_proc = add_to_start(this_proc, "quality_calibration_zoom");
    // }

    // if (typeof project_json.this_condition.details_warning !== "undefined" && project_json.this_condition.details_warning.toLowerCase() === "no") {
    //   //skip this
    // } else {
    //   this_proc = add_to_start(this_proc, "quality_details_warning");
    // }

    // if (typeof project_json.this_condition.age_check !== "undefined" && project_json.this_condition.age_check.toLowerCase() === "no") {
    //   //skip this
    // } else {
    //   this_proc = add_to_start(this_proc, "quality_age_check");
    // }

    // this_proc = add_to_start(this_proc, "quality_participant_commitment");

    // // Adjust this so that it pulls in information from the "start message" field to populate the text if needed
    // if (typeof project_json.this_condition.welcome !== "undefined" && project_json.this_condition.welcome.toLowerCase() === "no") {
    //   //skip this
    // } else {
    //   parent.parent.welcome_message = project_json.this_condition.welcome;
    //   this_proc = add_to_start(this_proc, "quality_welcome_message");
    // }
    
    /*
     * Load the code for the quality checks that will
     * occur at the start and end of the experiment
     */

    var quality_checks = [
      {
        url: "Quality/AgeCheck.html",
        name: "quality_age_check",
      },
      {
        url: "Quality/BotCheck.html",
        name: "quality_bot_check",
      },
      {
        url: "Quality/AudioVisual.html",
        name: "quality_audio_visual",
      },
      {
        url: "Quality/Calibration.html",
        name: "quality_calibration_zoom",
      },
      {
        url: "Quality/DetailsWarning.html",
        name: "quality_details_warning",
      },
      {
        url: "Quality/ParticipantCommitment.html",
        name: "quality_participant_commitment",
      },
      {
        url: "Quality/Problems.html",
        name: "end_checks_experiment",
      },
      {
        url: "Quality/WelcomeMessage.html",
        name: "quality_welcome_message",
      },
    ];

    load_quality_checks(quality_checks);
  }
}

function load_phases() {
  var org_repo = project_json.location.split("/");
  switch (Project.get_vars.platform) {
    case "simulateonline":
    case "localhost":
    case "preview":
      home_dir = CElectron.git.locate_repo({
        org: org_repo[0],
        repo: org_repo[1],
      });
      break;
  }

  var loaded_phases = 0;
  var phases = Object.keys(project_json.phasetypes).length;
  Object.keys(project_json.phasetypes).forEach(function (phasetype) {
    var this_phase = project_json.phasetypes[phasetype];
    if (this_phase.indexOf("[[[LOCATION]]]../Default") === 0) {
      var code_location = this_phase.replace("[[[LOCATION]]]", "");
      $.get(code_location, function (phase_code) {
        project_json.phasetypes[phasetype] = phase_code;
        loaded_phases++;
        if (loaded_phases === phases) {
          Project.activate_pipe();
        }
      });
    } else if (this_phase.indexOf("[[[LOCATION]]]../User") === 0) {
      switch (Project.get_vars.platform) {
        case "onlinepreview":
        case "github":
          var code_location = this_phase.replace("[[[LOCATION]]]..", "..");
          break;
        case "localhost":
        case "onlinepreview":
        case "preview":
        case "simulateonline":
          var code_location = this_phase.replace("[[[LOCATION]]]..", home_dir);
          break;
      }
      $.get(code_location, function (phase_code) {
        project_json.phasetypes[phasetype] = phase_code;
        loaded_phases++;
        if (loaded_phases === phases) {
          Project.activate_pipe();
        }
      });
    } else {
      loaded_phases++;
      if (loaded_phases === phases) {
        Project.activate_pipe();
      }
    }
  });
}

function parse_sheets() {
  
  var proc_sheet_name = project_json.this_condition.procedure.toLowerCase().split('_')[0];

  // This is the original code that loads the stim sheets in and then activates the rest of the Collector pipeline
  function switch_platform () {
    var stim_sheet_name = project_json.this_condition.stimuli.toLowerCase().replace(".csv", "") + ".csv";
    proc_stim_loaded = [];
  
    switch (Project.get_vars.platform) {
      case "localhost":
      case "simulateonline":
      case "preview":
        var folder = "Projects/" + Project.get_vars.location;
        var proc_sheet_content = CElectron.fs.read_file(folder,proc_sheet_name);
        var stim_sheet_content = CElectron.fs.read_file(folder,stim_sheet_name);
        project_json.parsed_proc = Collector.PapaParsed(proc_sheet_content);
        project_json.parsed_stim = [null, null].concat(Collector.PapaParsed(stim_sheet_content));
        Project.activate_pipe();
        break;
      case "github":
      case "onlinepreview":
        var proc_url = "../User/Projects/" + Project.get_vars.location + "/" + proc_sheet_name;
        $.get(proc_url, function (proc_sheet_content) {
          project_json.parsed_proc = Collector.PapaParsed(proc_sheet_content);
          proc_stim_loaded[1] = "procedure";
          if (proc_stim_loaded.join("-") === "stimuli-procedure") {
            Project.activate_pipe();
          }
        });
        var stim_url = "../User/Projects/" + Project.get_vars.location + "/" + stim_sheet_name;
        $.get(stim_url, function (stim_sheet_content) {
          project_json.parsed_stim = [null, null].concat(Collector.PapaParsed(stim_sheet_content));
          proc_stim_loaded[0] = "stimuli";
          if (proc_stim_loaded.join("-") === "stimuli-procedure") {
            Project.activate_pipe();
          }
        });
        break;
      case "server":
        proc_stim_loaded[1] = "procedure";
        project_json.parsed_proc = Collector.PapaParsed(project_json.all_procs[proc_sheet_name]);
        if (proc_stim_loaded.join("-") === "stimuli-procedure") {
          Project.activate_pipe();
        }
        project_json.parsed_stim = [null, null].concat(
          Collector.PapaParsed(project_json.all_stims[stim_sheet_name])
        );
        proc_stim_loaded[0] = "stimuli";
        if (proc_stim_loaded.join("-") === "stimuli-procedure") {
          Project.activate_pipe();
        }
        break;
    }
  }

  function counterbalance(action) {
    // NOTE: There's a copy of this as 'Phase.Counterbalance' that allows you to reset things if needed (i.e., if someone tries with the wrong browser is allows you to reset the coutnerbalancing system).
    phpFileURL = project_json.this_condition.counterbalance;
    $.ajax({
        type: 'POST',
        url: phpFileURL,
        data: { action: action },
        success: function(response) {
            if (action == 'location') {
                console.log("Location Response: " + response);
                proc_sheet_name = response;
                switch_platform();
            } else if (action == 'reset') {
                console.log("Reset Response: " + response);
            }
        },
        error: function(response) {
          console.log("Location Response: " + response);
          bootbox.alert("An error has occured with the counterbalancing system, please contact the researcher before continuing.")
           proc_sheet_name = project_json.this_condition.procedure.toLowerCase().replace(".csv", "") + ".csv";
           switch_platform();
        }
    });
  }
  
  if (typeof project_json.this_condition.counterbalance !== 'undefined') {
    if (project_json.this_condition.counterbalance !== '') {
      parent.parent.counterbalancing = true;
      counterbalance('location');
    } else {
      parent.parent.counterbalancing = false;
      proc_sheet_name = project_json.this_condition.procedure.toLowerCase();
      proc_sheet_name = project_json.this_condition.procedure.toLowerCase().replace(".csv", "") + ".csv";
      switch_platform();
    }
  } else {
    parent.parent.counterbalancing = false;
    proc_sheet_name = project_json.this_condition.procedure.toLowerCase().replace(".csv", "") + ".csv";
    switch_platform();
  }
}

function parse_current_proc() {
  function proc_apply_repeats() {
    var this_proc = project_json.parsed_proc;
    repeat_cols = ["weight", "frequency", "freq", "repeat"];
    var repeat_cols_pres = [];
    Object.keys(this_proc[0]).forEach(function (header) {
      if (repeat_cols.indexOf(header) !== -1) {
        repeat_cols_pres.push(header);
      }
    });

    if (repeat_cols_pres.length > 1) {
      bootbox.alert(
        "There are multiple columns that do the same thing, please only use one of them: " +
          repeat_cols_pres.join(" , ") +
          ". If you are a participant, please contact the researcher and tell them about this problem."
      );
    }

    /*
     * fill in repeats
     */
    var filled_proc = [];
    for (var i = 0; i < this_proc.length; i++) {
      var this_row = this_proc[i];

      this_row.repeat =
        typeof this_row.weight !== "undefined"
          ? this_row.weight
          : typeof this_row.frequency !== "undefined"
          ? this_row.frequency
          : typeof this_row.freq !== "undefined"
          ? this_row.freq
          : typeof this_row.repeat !== "undefined"
          ? this_row.repeat
          : "";

      if (typeof this_row.repeat !== "undefined" && this_row.repeat !== "") {
        for (var k = 0; k < this_row.repeat; k++) {
          filled_proc.push(this_row);
        }
      } else {
        filled_proc.push(this_row);
      }
    }
    project_json.parsed_proc = filled_proc;
  }
  function proc_fill_items() {
    var this_proc = project_json.parsed_proc;
    var filled_proc = [];

    for (var j = 0; j < this_proc.length; j++) {
      var row = this_proc[j];
      if (row.item.indexOf(" to ") === -1 && row.item.indexOf(",") === -1) {
        filled_proc.push(row);
      } else {
        var items_array = row.item.split(",");
        var complete_items_array = [];
        items_array.forEach(function (item) {
          if (item.indexOf(" to ") === -1) {
            complete_items_array.push(item);
          } else {
            item_start_end = item.split(" to ");

            if (item_start_end.length > 2) {
              bootbox.alert(
                "There is a problem with the procedure sheet - see the row in which the item column value is " +
                  row.item +
                  ", there is more than 1 ':' which is not allowed. If you are not the researcher, can you please send this message to them."
              );
            }
            var item_start = parseFloat(item_start_end[0]);
            var item_end = parseFloat(item_start_end[1]) + 1;
            for (
              var this_item = item_start;
              this_item < item_end;
              this_item++
            ) {
              complete_items_array.push(this_item);
            }
          }
        });

        complete_items_array.forEach(function (item) {
          var this_row_with_this_item = JSON.parse(JSON.stringify(row));
          this_row_with_this_item.item = item;
          filled_proc.push(this_row_with_this_item);
        });
      }
    }
    project_json.parsed_proc = filled_proc;
  }
  project_json.parsed_proc = project_json.parsed_proc.filter(function (row) {
    return (
      Object.keys(row).every(function (x) {
        return row[x] === "" || row[x] === null;
      }) === false
    );
  });

  // add progress here
    // check if there are weight 0 rows:
    var weight_0s = 0;
    var weight_1s = 0;
  for(var i = 0; i < project_json.parsed_proc.length; i++){
    if(project_json.parsed_proc[i].weight == "0"){
      weight_0s++;
    } else if (parseInt(project_json.parsed_proc[i].weight) > 1) {
      weight_1s += parseInt(project_json.parsed_proc[i].weight);
    } else {
      weight_1s++;
    }
  }

  var this_progress = 0;
  for(var i = 0; i < project_json.parsed_proc.length; i++){
    if(project_json.parsed_proc[i].weight == "0"){
      // do nothing
    } else {
      this_progress++;
      project_json.parsed_proc[i].phase_progress = this_progress / weight_1s;
    }
  }
  proc_fill_items();
  proc_apply_repeats();
  Project.activate_pipe();
}

function participant_backup() {
  window.localStorage.setItem("project_json", JSON.stringify(project_json));
  window.localStorage.setItem("username", $("#participant_code").val());
}

function post_welcome(participant_code, id_error) {
  var completion_code = Math.random().toString(36).substr(2, 10);
  window.localStorage.setItem("completion_code", completion_code);
  $("#completion_code").val(completion_code);
  var prehashed_code = Math.random().toString(36).substr(2, 10);
  window.localStorage.setItem("prehashed_code", prehashed_code);
  $("#prehashed_code").val(prehashed_code);
  switch (Project.get_vars.platform) {
    case "github":
    case "localhost":
    case "onlinepreview":
    case "preview":
    case "server":
    case "simulateonline":
      id_error = "skip";
      post_welcome_data("blank");
      break;
  }
}

function post_welcome_data(returned_data) {
  if (returned_data === "blank") {
    id_error = "skip";
  }

  if ((returned_data === "blank") | (returned_data.indexOf("error") !== -1)) {
    if (id_error === "skip") {
      $("#welcome_div").hide();
      $("#post_welcome").show();
      $("#project_div").show();
      //full_screen(); {CGD} Commented out to stop multiple "do you want to do full screen?" messages
    } else if (id_error === "random") {
      var this_code = Math.random().toString(36).substr(2, 16);
      post_welcome(this_code, "random");
    } else if (id_error === false) {
      bootbox.confirm(returned_data, function (response) {
        if (response) {
          $("#welcome_div").hide();
          $("#post_welcome").show();
          $("#project_div").show();
          //full_screen();
        }
      });
    }
  }
}

function precrypted_data(decrypted_data, message) {
  responses_csv = decrypted_data.responses;
  response_headers = [];
  responses_csv.forEach(function (row) {
    Object.keys(row).forEach(function (item) {
      if (response_headers.indexOf(item) === -1) {
        response_headers.push(item);
      }
    });
  });
  this_condition = decrypted_data.this_condition;
  condition_headers = Object.keys(this_condition).filter(function (item) {
    return item !== "_empty_";
  });
  table_headers = response_headers.concat(condition_headers);
  downloadable_csv = [table_headers];
  if(parent.parent.go_to_active){
    var responses_csv = responses_csv.filter(value => Object.keys(value).length !== 0);
  }
  responses_csv.forEach(function (row, row_no) {
    downloadable_csv.push([]);
    table_headers.forEach(function (item, item_no) {
      if (typeof row[item] !== "undefined") {
        downloadable_csv[row_no + 1][item_no] = row[item];
      } else if (condition_headers.indexOf(item) !== -1) {
        downloadable_csv[row_no + 1][item_no] = this_condition[item];
      } else {
        downloadable_csv[row_no + 1][item_no] = "";
      }
    });
  });
  if (!parent.parent.functionIsRunning) {
    parent.parent.functionIsRunning = true;
    bootbox.prompt({
      title: message,
      value: $("#participant_code").val() + "_" + parent.parent.start_date_time + ".csv",
      callback: function (result) {
        parent.parent.functionIsRunning = false;
        if (result !== null) {
          save_csv(result, Papa.unparse(downloadable_csv));
        }
      },
    });
  }
}

function process_welcome() {
  if (document.getElementById("loading_project_json") !== null) {
    /*
     * skip participant id? (and thus start_message)
     */
    var pp_id_setting;
    if (Project.get_vars.platform === "preview") {
      pp_id_setting = "random";
    } else {
      pp_id_setting = project_json.this_condition.participant_id;
    }

    // put in a participant ID that is clearly not unique (e.g. "notUnique").
    if (pp_id_setting === "off") {
      $("#participant_code").val("notUnique");
      //"skip" means that it will automatically accept non unique ids
      post_welcome("notUnique", "skip");
    } else if (pp_id_setting === "random") {
      var this_code = Math.random().toString(36).substr(2, 16);
      $("#participant_code").val(this_code);
      post_welcome(this_code, "random");
    } else if (pp_id_setting === "on") {
      $("#loading_project_json").fadeOut(500);
      $("#researcher_message").fadeIn(2000);
      $("#participant_id_div").show(1000);
    } else if(pp_id_setting === "redcap"){
      $("#participant_code").val(Project.get_vars.redcap_id);
      post_welcome(Project.get_vars.redcap_id, "redcap");
    } else {
      bootbox.alert("It's not clear if the researcher wants you to give them a user id - please contact them before proceeding.");
    }

    if (project_json.this_condition.start_message !== "") {
      $("#researcher_message").html(project_json.this_condition.start_message);
    } else {
      def_start_msg =
        '<div class="card"><div class="card-header text-primary">'+
          '<h2>Collector</h2>'+
        '</div>'+
        '<div class="card-body">'+
          "<h5>It's very important to read the following before starting!</h5><br>" +
          '<p class="text-danger">If you complete multiple Collector experiments at the same time, your completion codes may be messed up. Please do not do this!' +
          'If you participate in this experiment, your progress in it will be stored on your local machine to avoid you losing your progress if the window or tab closes or freezes.'+
          'This data will be cleared from your computer once you have completed the task.<b><br><br>However, if you do not want this website to store your progress on your computer, DO NOT PROCEED.</b><br><br>' +
          'If the experiment freezes, try pressing <b>CTRL-S</b> to save your data so far.</p></div>'+
        '</div></div>';

      $("#researcher_message").html(def_start_msg);
    }
  }
}

function requestFullScreen(element) {
  // Supports most browsers and their versions.
  var requestMethod =
    element.requestFullScreen ||
    element.webkitRequestFullScreen ||
    element.mozRequestFullScreen ||
    element.msRequestFullScreen;

  if (requestMethod) {
    // Native full screen.
    requestMethod.call(element);
  } else if (typeof window.ActiveXObject !== "undefined") {
    // Older IE.
    var wscript = new ActiveXObject("WScript.Shell");
    if (wscript !== null) {
      wscript.SendKeys("{F11}");
    }
  }
}

function select_condition() {
  project_json.this_condition = project_json.conditions.filter(function (row) {
    return row.name === Project.get_vars.name;
  })[0];
  //console.log(project_json.this_condition)
  /*
   * Check if use of mobile devices is off
   */
  if (
    typeof project_json.this_condition.mobile !== "undefined" &&
    project_json.this_condition.mobile.toLowerCase() === "no" &&
    window.mobilecheck()
  ) {
    alert(
      "This experiment will not run on a mobile device. Please complete it on a laptop or desktop (using google chrome if possible)."
    );
  } else {
    Project.activate_pipe();
  }
}

function shuffle_start_exp() {

  // Get the shuffle levels
  var shuffle_levels = Object.keys(project_json.parsed_proc[0]).filter(
    (item) => item.indexOf("shuffle") !== -1
  );
  shuffle_levels = shuffle_levels.sort((a, b) => b.localeCompare(a, undefined, { numeric: true })); // Sort in descending order

  // Perform within-block shuffling for shuffle_1
  var shuffle_array = {};
  project_json.parsed_proc.forEach(function (row, index) {
    var this_shuffle = row["shuffle_1"];
    if (this_shuffle && this_shuffle !== "off") {
      if (!shuffle_array[this_shuffle]) {
        shuffle_array[this_shuffle] = [index];
      } else {
        shuffle_array[this_shuffle].push(index);
      }
    }
  });

  // Shuffle each block within shuffle_1
  Object.keys(shuffle_array).forEach(function (key) {
    shuffleArray(shuffle_array[key]);
    shuffleArray(shuffle_array[key]); // I'm doing a second shuffle because I wasn't happy with how "random" things appeared even though they were!
  });

  // Create a new procedure array preserving the position of 'off' and blank rows
  var new_proc = Array(project_json.parsed_proc.length).fill(null);
  var non_shuffled_indices = [];

  project_json.parsed_proc.forEach(function (row, original_index) {
    if (row["shuffle_1"] === "off" || row["shuffle_1"] === "") {
      new_proc[original_index] = row;
      non_shuffled_indices.push(original_index);
    } else {
      var this_shuffle = row["shuffle_1"];
      var this_pos = shuffle_array[this_shuffle].shift();
      new_proc[this_pos] = project_json.parsed_proc[original_index];
    }
  });

  // Perform between-block shuffling for shuffle_2 and beyond
  shuffle_levels.forEach(function (shuffle_level) {
    if (shuffle_level !== "shuffle_1") {
        var block_groups = {};
        var non_shuffled_indices = [];
        
        // Group rows by shuffle_level value
        new_proc.forEach(function (row, index) {
            var block_value = row[shuffle_level];
            if (block_value === "off" || block_value === "") {
                non_shuffled_indices.push(index);
            }
            if (!block_groups[block_value]) {
                block_groups[block_value] = [];
            }
            block_groups[block_value].push(row);
        });

        // Shuffle the keys and concatenate the rows
        var shuffled_keys = Object.keys(block_groups).filter(key => key !== "off" && key !== "").sort(() => Math.random() - 0.5);

        var new_proc_order = [];
        shuffled_keys.forEach(function (key) {
            new_proc_order = new_proc_order.concat(block_groups[key]);
        });

        // Add non-shuffled rows back to their original positions
        non_shuffled_indices.forEach(function (index) {
            new_proc_order.splice(index, 0, new_proc[index]);
        });

        // Update new_proc with the correctly ordered rows
        new_proc = new_proc_order.concat(new_proc.filter(row => row !== null && !new_proc_order.includes(row)));
    }
  });

  // Finalise the shuffled array with all non-null values
  var final_proc = new_proc.filter(row => row !== null);

  project_json.parsed_proc = final_proc;

  if (typeof project_json.responses === "undefined") {
    project_json.responses = [];
  }

  project_json.wait_to_proc = false;

  /*
   * Adjusting the order of 'phase_progress' to account for the fact we just shuffled the parsed_proc array
   * (this ensures that the progress bar still displays correctly if used)
  */

  // Extract the 'phase_progress' values, ignoring the first row
  var phaseProgressValues = project_json.parsed_proc.slice(1).map(function(item) {
      return item.phase_progress;
  });

  // Sort the 'phase_progress' values
  phaseProgressValues.sort(function(a, b) {
      return a - b;
  });

  // Place the sorted values back into the array, ignoring the first row
  var index = 0;
  for (var i = 1; i < project_json.parsed_proc.length; i++) {
    if (project_json.parsed_proc[i] !== null) {
      project_json.parsed_proc[i].phase_progress = phaseProgressValues[index++];
    }
  }

  Project.activate_pipe();
}


// by Laurens Holst on https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array?utm_medium=organic&utm_source=google_rich_qa&utm_campaign=google_rich_qa
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

//solution by Tom Wadley at https://stackoverflow.com/questions/5767325/how-can-i-remove-a-specific-item-from-an-array
function removeItemAll(arr, value) {
  var i = 0;
  while (i < arr.length) {
    if (arr[i] === value) {
      arr.splice(i, 1);
    } else {
      ++i;
    }
  }
  return arr;
}

function start_restart() {
  if (isSafari) {
    bootbox.alert(
      "Please do not use Safari to complete this study. It is likely that your data will not save correctly if you do. Please close Safari and use another browser"
    );
    /*
    //blocking resume for now
  } else if(
    bootbox.alert("Please do not use Safari to complete this study. It is likely that your data will not save correctly if you do. Please close Safari and use another browser");
    /*
    //blocking resume for now
  } else if(
    (window.localStorage.getItem("project_json") !== null) &
    (Project.get_vars.platform !== "preview") &
    (project_json.conditions[0].resume == "yes")
  ) {
    bootbox.dialog({
      title: "Resume or Restart?",
      message:
        "It looks like you have already started, would you like to resume or restart?",
      buttons: {
        local: {
          label: "Resume",
          className: "btn-primary",
          callback: function () {
            project_json = JSON.parse(
              window.localStorage.getItem("project_json")
            );

            var participant_code = window.localStorage.getItem("username");
            var completion_code =
              window.localStorage.getItem("completion_code");
            var prehashed_code = window.localStorage.getItem("prehashed_code");
            $("#completion_code").val(completion_code);
            $("#prehashed_code").val(prehashed_code);
            if (participant_code === "") {
              bootbox.prompt(
                "What ID did you use?",
                function (this_participant_code) {
                  participant_code = this_participant_code;
                  $("#participant_code").val(participant_code);
                  post_welcome_data("blank");
                }
              );
            } else {
              $("#participant_code").val(participant_code);
              post_welcome_data("blank");
            }
          },
        },
        start: {
          label: "Restart",
          className: "btn-danger",
          callback: function () {
            Project.activate_pipe();
          },
        },
        cancel: {
          label: "Cancel",
          className: "btn-secondary",
          callback: function () {
            //nada;
          },
        },
      },
    });
    */
  } else  {
    Project.activate_pipe();
  }
}

function start_project() {
  /*
   * Try to at least center the experiment window if the browser isn't maximised
   */
  window.moveTo(0, 0);
  window.resizeTo(screen.availWidth, screen.availHeight);

  //detect if resuming

  if (Object.keys(project_json).length === 0) {
    switch (Project.get_vars.platform) {
      case "simulateonline":
      case "localhost":
      case "preview":
        electron_wait = setInterval(function () {
          if (typeof CElectron.fs.read_file !== "undefined") {
            clearInterval(electron_wait);
            project_json = JSON.parse(CElectron.fs.read_file("Projects",Project.get_vars.location + ".json")
            );
            /*
             * load conditions sheet
             */
            project_json.conditions = Collector.PapaParsed(CElectron.fs.read_file("Projects/" + Project.get_vars.location,"conditions.csv")
            );

            Project.activate_pipe();
          }
        }, 100);
        break;

      case "github":
      case "onlinepreview":
        /*
         * wrap into function that will automatically keep trying until you have succesfully loaded the experiment!
         */
        function recursive_load_experiment(random_code) {
          if (typeof random_code === "undefined") {
            random_code = "";
          }
          $.get("../User/Projects/" + Project.get_vars.location + ".json?randomcode=" + random_code, function (result) {
              project_json = result;

              $.get("../User/Projects/" + Project.get_vars.location + "/conditions.csv", function (conditions_sheet) {
                  project_json.conditions = Collector.PapaParsed(conditions_sheet);
                  Project.activate_pipe();
                }
              );
            }
          ).catch(function (error) {
            bootbox.confirm(
              "It looks like the experiment you're trying to load isn't there (yet) - click OK if you'd like to try to load the experiment again (clicking OK can be quicker than constantly refreshing the page)?",
              function (result) {
                if (result) {
                  recursive_load_experiment(Collector.makeid(5));
                }
              }
            );
            console.dir(error);
          });
        }
        recursive_load_experiment();

        break;
      default:
        if (
          typeof Project.get_vars.location !== "undefined" &&
          Project.get_vars.location !== ""
        ) {
          if (Project.get_vars.location.indexOf("www.dropbox") !== -1) {
            get_location = Project.get_vars.location.replace("www.", "dl.");
          } else {
            get_location = Project.get_vars.location;
          }
          $.get(get_location, function (this_project) {
            project_json = JSON.parse(this_project);
            Project.activate_pipe();
          });
        }
        break;
    }
  } else {
    Project.activate_pipe();
  }
}

function write_phase_iframe(index) {
  if (typeof project_json.parsed_proc[index] === "undefined") {
    return null;
  }

  var phase_iframe = $("<iframe>")
    .addClass("phase_iframe")
    .attr("frameBorder", "0")
    .attr("id", "phase" + index)
    .attr("scrolling", "no");

  $("#project_div").append(phase_iframe);

  this_proc = project_json.parsed_proc[index];

  var post_code = Object.keys(this_proc).filter(function (key) {
    return /phasetype/.test(key);
  });


  phase_events = post_code.filter(function (post_phase) {
    return this_proc[post_phase] !== "";
  });
  phase_iframe_code = "";

  // write an iframe with the required number of sub_iframes
  for (var i = 0; i < phase_events.length; i++) {
    if (this_proc[phase_events[i]] !== "") {
      var post_iframe = $("<iframe>")
        .addClass("post_iframe")
        .attr("frameBorder", "0")
        .attr("id", "post" + i)
        .css("height", "100%")
        .css("width", "100%");
      phase_iframe_code += post_iframe[0].outerHTML;
    }
  }
  doc = document.getElementById("phase" + index).contentWindow.document;
  doc.open();
  try {
    doc.write(phase_iframe_code);
  } catch (error) {
    alert("failed to write the phase_code");
    alert(error);
  }
  doc.close();

  for (let i = 0; i < phase_events.length; i++) {
    var phase_content = Project.generate_phase(index, i);
      // phase_content +=
      '<button style="opacity:0; filter: alpha(opacity=0)" id="zzz"></button>' + phase_content;
    doc = document
      .getElementById("phase" + index)
      .contentWindow.document.getElementById("post" + i).contentWindow;
    doc.document.open();

    /*
     * New attempt to check if images have loaded succesfully
     */
    var img_check_code =
      "<scr" + 'ipt src="libraries/collector/StimuliChecks.js"></scr' + "ipt>";
    var timer_code;
    if (
      typeof this_proc["max_time"] !== "undefined" &&
      this_proc["max_time"] !== "user" &&
      this_proc["max_time"] !== ""
    ) {
      timer_code = Project.html_code.Timer;
      if (
        typeof this_proc.timer_style !== "undefined" &&
        this_proc.timer_style !== ""
      ) {
        if(this_proc.timer_style.toLowerCase() === "progress"){
          timer_code = timer_code
          .replace(
            "[[TIMER_HERE]]",
            '<div class="progress" id="progress_parent">' +
              '<div class="progress-bar" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" id="progress_bar"></div>' +
            '</div>'
          )
          .replace(
            "var time_format;",
            "var time_format = 'progress'"
          )
        } else {
          timer_code = timer_code
          .replace(
            "[[TIMER_HERE]]",
            '<h1 id="collector_phase_timer" class="bg-white"></h1>'
          )
          .replace(
            "#collector_phase_timer{",
            "#collector_phase_timer{" + this_proc.timer_style + ";"
          );
        }
      } else {
        timer_code = timer_code
        .replace(
          "[[TIMER_HERE]]",
          '<h1 id="collector_phase_timer" class="bg-white"></h1>'
        )
        .replace(
          "#collector_phase_timer{",
          "#collector_phase_timer{" +
          "position: absolute;"+
          "right: 0px;"+
          "padding: 5px;"+
          "border-radius: 10px;"+
          "border-width: 5px;"+
          "border-color: #006688;"+
          "border-style: solid;"+
          "width : 125px;" +
          "opacity: 0;"

        )
        .replace(
          "var time_format;",
          "var time_format = 'numbers'"
        );
      }
    } else {
      timer_code = "";
    }
    doc.document.write(libraries + phase_content + timer_code + img_check_code);
    doc.document.close();

    //autoscroll to top of iframe (in case the phase runs over)
    doc.scrollTo(0, 0);

    var no_images = (phase_content.match(/<img/g) || []).length;
    project_json.uninitiated_stims.push(no_images);
    project_json.uninitiated_stims_sum = project_json.uninitiated_stims.reduce(
      function (acc, val) {
        return acc + val;
      }
    );

    if (typeof stim_interval === "undefined") {
      //need code here to deal with "buffering" when there are no images.
      stim_interval = setInterval(function () {
        project_json.initiated_stims = 0;
        for (
          var j = project_json.phase_no;
          j < project_json.phase_no + project_json.this_condition.buffer;
          j++
        ) {
          if (
            $("#phase" + j)
              .contents()
              .children()
              .find("iframe")
              .contents()
              .children()
              .find("img")
              .prop("complete")
          ) {
            //if($("#phase"+j).contents().find('img').prop('complete') == true){
            project_json.initiated_stims += $("#phase" + j)
              .contents()
              .children()
              .find("iframe")
              .contents()
              .children()
              .find("img").length;
          }
        }
        var completion =
          100 -
          project_json.initiated_stims / project_json.uninitiated_stims_sum;
        $("#stim_listing").css("width", completion + "%");
        if ((completion === 100) | (project_json.uninitiated_stims_sum === 0)) {
          clearInterval(stim_interval);
          $("#stim_progress").fadeOut(1000);
          if ($("#calibrate_div").is(":visible") === false) {
            $("#project_div").fadeIn(500);
          }
          if (project_json.wait_to_proc) {
            bootbox.alert(
              "It looks like you have closed the window midway through an experiment. Please press OK when you are ready to resume the experiment!",
              function () {
                Project.start_post();
              }
            );
          } else {
            Project.start_post();
          }
        }
      }, 10);
    }
  }
}

/*
 * allow participant to save part way
 */
$(window).bind("keydown", function (event) {
  if (event.ctrlKey || event.metaKey) {
    switch (String.fromCharCode(event.which).toLowerCase()) {
      case "s":
        event.preventDefault();
        precrypted_data(project_json, "What do you want to save this file as?");
        break;
    }
  }
});

//prevent closing without warning
// window.onbeforeunload = function () {
//   switch (Project.get_vars.platform) {
//     case "simulateonline":
//     case "localhost":
//       break;
//     default:
//       if (online_data_obj.finished_and_stored === false) {
//         bootbox.confirm(
//           "Would you like to leave the experiment early? If you didn't just download your data there's a risk of you losing your progress.",
//           function (result) {
//             if (result) {
//               online_data_obj.finished_and_stored = true; //even though it's not
//             }
//           }
//         );
//         precrypted_data(
//           project_json,
//           "It looks like you're trying to leave the experiment before you're finished (or at least before the data has been e-mailed to the researcher. Please choose a filename to save your data as and e-mail it to the researcher. It should appear in your downloads folder."
//         );

//         return "Please do not try to refresh - you will have to restart if you do so.";
//       }
//       break;
//   }
// };
$("body").css("text-align", "center");
$("body").css("margin", "auto");

//by qwerty at https://stackoverflow.com/questions/2116558/fastest-method-to-replace-all-instances-of-a-character-in-a-string
String.prototype.replaceAll = function (str1, str2, ignore) {
  return this.replace(
    new RegExp(
      str1.replace(/([\/\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|\<\>\-\&])/g, "\\$&"),
      ignore ? "gi" : "g"
    ),
    typeof str2 === "string" ? str2.replace(/\$/g, "$$$$") : str2
  );
};

/*
 * exports for testing
 */
if (typeof module !== "undefined") {
  module.exports = {
    clean_var: clean_var,
    clean_this_condition: clean_this_condition,
  };
}