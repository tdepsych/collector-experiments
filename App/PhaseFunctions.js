/*  Collector (Garcia, Kornell, Kerr, Blake & Haffey)
    A program for running experiments on the web
    Copyright 2012-2016 Mikey Garcia & Nate Kornell


    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License version 3 as published by
    the Free Software Foundation.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>

		Kitten/Cat release (2019-2022) author: Dr. Anthony Haffey (team@someopen.solutions)
*/
if (typeof Phase !== "undefined") {
  Phase.add_response = function (response_obj) {

    /*
     * Increase counter to reflect a new response
     */
    if(typeof(parent.parent.project_json.repeat_no) == "undefined"){
      parent.parent.project_json.repeat_no = parent.parent.project_json.phase_no;
    }

    parent.parent.project_json.repeat_no++;

    /*

     * Add all the normal response information here!

     */

    //response_obj.inserted_time_ms = new Date().getTime();
    //response_obj.inserted_time_date = new Date().toString("MM/dd/yy HH:mm:ss");
    parent.parent.project_json.responses.push(response_obj);

    parent.parent.project_json.phase_resp_no++;



    /*
     * Submit response if there's an online data thing.
     */
   if(typeof(parent.parent.project_json.this_condition.redcap_url) !== "undefined"){

       var phase_responses = response_obj;

       console.log("phase_responses");
       var this_location = parent.parent.project_json.location.split("/")[0].replaceAll("-","") + "_" + parent.parent.project_json.location.split("/")[1].replaceAll("-","");
       //phase_responses.location;
       /*
       * update all the keys to have the "location_" before them
       */

       var clean_phase_responses = {};

       Object.keys(phase_responses).forEach(function(old_key){

         //if(phase_responses[old_key].toLowerCase() !== "condition_redcap_url" & phase_responses[old_key] !== ""){


           clean_phase_responses[this_location + "_" + old_key] =
           phase_responses[old_key]
         //}
       });
       delete(clean_phase_responses[
         this_location + "_condition_redcap_url"
       ]);
       delete(clean_phase_responses[
         this_location + "_"
       ]);

       console.log("clean_phase_responses");
       console.log(clean_phase_responses);
       clean_phase_responses.record_id = parent.parent.$("#participant_code").val();


       clean_phase_responses['redcap_repeat_instance'] =
parent.parent.project_json.repeat_no; //        parent.parent.project_json.phase_no + "-" + parent.parent.project_json.phase_resp_no;
       clean_phase_responses['redcap_repeat_instrument'] = this_location;


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


       console.log("just before the ajax");
       $.ajax({
         type: "POST",
         url: parent.parent.project_json.this_condition.redcap_url,
         crossDomain: true,
         data: clean_phase_responses

         /*
         {
           "record_id": parent.parent.$("#prehashed_code").val(),
           "participant_code": $("#participant_code").val(),
           "trial_no" : parent.parent.project_json.trial_no,
           //"participant_confirm": parent.parent.$("#prehashed_code").val(),
           "shape_response_time": this_rt,
           "color_response": $("#color_response").val(),
           "shape_response_complete": 2
         }
         */,
         success: function(result){
           console.log("result");
           console.log(result);
           //Phase.submit();
         }
       });
     }
  };

  Phase.elapsed = function () {
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
    return parent.parent.project_json.all_procs[this_name];
  };
  Phase.get_stim = function (this_name) {
    return parent.parent.project_json.all_stims[this_name];
  };
  Phase.go_to = function (new_trial_no) {
    parent.parent.Project.go_to(new_trial_no);
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
