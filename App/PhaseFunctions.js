/*  
 *	PhaseFunctions.js
 *	Collector Kitten/Cat release (2019-2023) © Dr. Anthony Haffey (team@someopen.solutions)
*/
var start_date_time = new Date().toLocaleDateString("en-US").replaceAll("/","_") + "_" + new Date().toLocaleTimeString().replaceAll(":","_");
var redcap_marker_update = false // This is just to tell whether the add_response() call is updating redcap markers of submitting experimental data
// Collector Phase Functions
if (typeof Phase !== "undefined") {

  /* ADD A NEW RESPONSE WITHOUT ENDING PHASE 
   * *************************************** */
  Phase.add_response = function (response_obj) {
    /* If we don't have a repeat number set have a repeat_no set - then this is the first
       time we've added a response and so set the repeat_no to be the current phase number 
    */
    if(typeof(parent.parent.project_json.repeat_no) == "undefined"){
      parent.parent.project_json.repeat_no = parent.parent.project_json.phase_no;
    }

    /* Then we want to add 1 to the repeat_no
    */
    parent.parent.project_json.repeat_no++;

    // This pushed the responses
    parent.parent.project_json.responses.push(response_obj);

    parent.parent.project_json.phase_resp_no++


    // If we have a REDCap URL set do the following....
   if(typeof(parent.parent.project_json.this_condition.redcap_url) !== "undefined"){

       var phase_responses = response_obj;
       var clean_phase_responses = {};

      Object.keys(phase_responses).forEach(function(old_key){
        clean_phase_responses[old_key] = phase_responses[old_key];
      });

      // This populates out the condition _name, _stimuli, and _procedure columns
      Object.keys(parent.parent.project_json.this_condition).forEach(function (condition_item) {
        clean_phase_responses["condition_" + condition_item] = parent.parent.project_json.this_condition[condition_item];
      });

      // This removes the data we don't need in REDCap based on the list at the top.
      parent.parent.add_response_remove_fields.forEach(adjust_redcap_array)
        function adjust_redcap_array(field) {
          delete(clean_phase_responses[field]);
        };
      // This sets the REDCap record ID.  

      var post_string = "post_" + parent.parent.project_json.post_no;
      if (redcap_marker_update){
        console.log("Updating Redcap Markers")
      } else {
        var add_response_time_ms = new Date().getTime();
        clean_phase_responses[post_string + "_phase_start_ms"] = parent.parent.phase_start_time_ms;
        clean_phase_responses[post_string + "_rt_ms"] = add_response_time_ms - parent.parent.phase_start_time_ms;
        clean_phase_responses[post_string + "_time"]     = new Date().toLocaleTimeString();
        if (window.innerHeight === screen.height) {
          clean_phase_responses[post_string + "_fullscreen"] = true;
        } else {
          clean_phase_responses[post_string + "_fullscreen"] = false;
        } 
      
      clean_phase_responses[post_string + "_us_date"] = new Date().toLocaleDateString("en-US");
      clean_phase_responses[post_string + "_screen_height"] = screen.height;
      clean_phase_responses[post_string + "_screen_width"] = screen.width;
      clean_phase_responses.participant_browser = parent.parent.participant_browser;
      clean_phase_responses.platform = window.navigator.platform;
      clean_phase_responses['username'] = parent.parent.$("#participant_code").val();
      clean_phase_responses['phase_number'] = parent.parent.project_json.phase_no;
    }
      clean_phase_responses.record_id = parent.parent.$("#participant_code").val() + "_" + parent.parent.start_date_time;
      clean_phase_responses['redcap_repeat_instance'] = parent.parent.project_json.repeat_no;
      clean_phase_responses['redcap_repeat_instrument'] = "main";

       console.log("just before the ajax");
       function redcap_post(this_url,this_data){
        $.ajax({
          type: "POST",
          url: this_url,
          crossDomain: true,
          data: this_data,

         success: function(result){
           console.log("Add_Response Sent");
         }
       });
     };
     redcap_post(parent.parent.project_json.this_condition.redcap_url,clean_phase_responses);
  };
  };
  Phase.counterbalance = function(){
    var url_php = parent.parent.project_json.this_condition.counterbalance + parent.parent.project_json.this_condition.name + ".php";
    var url_txt = parent.parent.Project.get_vars.location + "_" + parent.parent.project_json.this_condition.name + ".txt";
    new_data = parent.parent.cb_level;
    $.ajax({
      type: "POST",
      url: url_php,
      crossDomain: true,
      data: {new_data: new_data, url_txt: url_txt},
      success: function(result){
        console.log("counterbalance reset");
      }
    });
  };
  Phase.elapsed = function () {
    alert("Don't use this function, as it has an average lag of 10-20ms. This code hasn't been deleted as this might be addressed in the future. Instead, you can use something like \n\n Phase.set_timer(function(){\nbaseline_time_manual = (new Date()).getTime();\n},0);\n\n to capture the time the phase started.");
    if (Phase.post_no == "") {
      Phase.post_no = 0;
    }
    return (
      new Date().getTime() -
      parent.parent.project_json.this_phase[
        "post_" + Phase.post_no + "_phase_start_ms"
      ]
    );
  };
  Phase.get = function (this_name) {
    return parent.parent.project_json.study_vars[this_name];
  };
  Phase.get_proc = function (this_name) {
    // return parent.parent.project_json.all_procs[this_name]; <- this line just inserts the stimuli sheet as a comma separated list
    required_proc_sheet = parent.parent.project_json.all_procs[this_name];
    var required_proc_sheetConverted = csvToArray(required_proc_sheet)
    return required_proc_sheetConverted
    // {CGD} It would be good to make this function swap the loaded procedure sheet so you could alter a study based on prior performance if needed
  };
  Phase.get_stim = function (this_name) {
    // return parent.parent.project_json.all_stims[this_name]; <- this line just inserts the stimuli sheet as a comma separated list
    required_stim_sheet = parent.parent.project_json.all_stims[this_name];
    var required_stim_sheetConverted = csvToArray(required_stim_sheet)
    return required_stim_sheetConverted
    // {CGD} It would be good to make this function swap the loaded stimuli sheet so you could alter a task based on prior performance if needed
  };
  Phase.go_to = function (new_phase_no) {
    parent.parent.go_to_active = true;
    parent.parent.Project.go_to(new_phase_no);
  };
  Phase.redcap_markers = function(){
    console.log("redcap repeat no: " + parent.parent.project_json.repeat_no)
    redcap_marker_update = true;
    var redcap_instances = parseInt(parent.parent.project_json.repeat_no) + parseInt(parent.parent.project_json.this_condition.buffer);
    console.log("redcap instances: "+redcap_instances)
    // var redcap_safety = parent.parent.project_json.phase_no * 2;
    var redcap_safety = redcap_instances * 2;
    for (var i = 0; i <= redcap_instances; i++) {
      if (i === redcap_safety) { console.log("!!! For Loop Break Activated !!!");break; }
      parent.parent.project_json.repeat_no = i;
      Phase.add_response({
        main_complete: 2
      });
    }
  };
  Phase.set = function (this_name, this_content) {
    if (typeof parent.parent.project_json.study_vars == "undefined") {
      parent.parent.project_json.study_vars = {};
    }
    parent.parent.project_json.study_vars[this_name] = this_content;
  };

  /*
   * Make the Phase.setTimeout timer function here
   * based on https://stackoverflow.com/questions/7798680/add-duration-to-js-settimeout-after-the-timer-is-running
   */
  Phase.timer = function (callback, time) {
    this.setTimeout(callback, time);
  };

  Phase.timer.prototype.setTimeout = function (callback, time) {
    var self = this;
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.finished = false;
    this.callback = callback;
    this.time = time;
    this.timer = setTimeout(function () {
      self.finished = true;
      callback();
    }, time);
    this.start = Date.now();
  };

  Phase.timer.prototype.add = function (time) {
    if (!this.finished) {
      // add time to time left
      time = this.time - (Date.now() - this.start) + time;
      this.setTimeout(this.callback, time);
    }
  };

  Phase.setTimeout = function (this_function, duration) {};
  Phase.set_timer = function (this_function, duration) {
    parent.parent.project_json.time_outs.push({
      phase_no: Phase.phase_no,
      post_no: Phase.post_no,
      duration: duration,
      this_func: this_function,
    });
  };
  Phase.submit = function () {
    parent.parent.project_json.inputs = jQuery("[name]");
    parent.parent.Project.finish_phase();
  };
}

$(window).bind("keydown", function (event) {
  if (event.ctrlKey || event.metaKey) {
    switch (String.fromCharCode(event.which).toLowerCase()) {
      case "s":
        event.preventDefault();
        parent.parent.precrypted_data(
          parent.parent.project_json,
          "What do you want to save this file as?"
        );
        break;
    }
  }
});
function save_csv(filename, data) {
  var blob = new Blob([data], { type: "text/csv" });
  if (window.navigator.msSaveOrOpenBlob) {
    window.navigator.msSaveBlob(blob, filename);
  } else {
    var elem = window.document.createElement("a");
    elem.href = window.URL.createObjectURL(blob);
    elem.download = filename;
    document.body.appendChild(elem);
    elem.click();
    document.body.removeChild(elem);
  }
}

//by qwerty at https://stackoverflow.com/questions/2116558/fastest-method-to-replace-all-instances-of-a-character-in-a-string
String.prototype.replaceAll = function (str1, str2, ignore) {
  return this.replace(
    new RegExp(
      str1.replace(/([\/\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|\<\>\-\&])/g, "\\$&"),
      ignore ? "gi" : "g"
    ),
    typeof str2 == "string" ? str2.replace(/\$/g, "$$$$") : str2
  );
};

// Hidden phase submit
$(window).bind("keydown", function (event) {
  if(event.which == 88 && (event.ctrlKey || event.metaKey) && event.shiftKey) {
    Phase.submit();
  }
  $(document).unbind('keydown');
});

// "csv to array" Function
// - https://github.com/nsebhastian/javascript-csv-array-example/blob/master/index.html
function csvToArray(str, delimiter = ",") {

  // slice from start of text to the first \n index
  // use split to create an array from string by delimiter
  const headers = str.slice(0, str.indexOf("\n")).split(delimiter);

  // slice from \n index + 1 to the end of the text
  // use split to create an array of each csv value row
  const rows = str.slice(str.indexOf("\n") + 1).split("\n");

  // Map the rows
  // split values from each row into an array
  // use headers.reduce to create an object
  // object properties derived from headers:values
  // the object passed as an element of the array
  const arr = rows.map(function (row) {
    const values = row.split(delimiter);
    const el = headers.reduce(function (object, header, index) {
      object[header] = values[index];
      return object;
    }, {});
    return el;
  });

  // return the array
  return arr;
}