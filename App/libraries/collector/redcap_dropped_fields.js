let main_remove_fields = [
    "buffer",
    "condition_",
    "condition_buffer",
    "condition_end_message",
    "condition_fullscreen",
    "condition_notes",
    "condition_participant_id",
    "condition_redcap_url",
    "condition_skip_quality",
    "condition_start_message",
    "end_message",
    "fullscreen",
    "item",
    "location",
    "main_complete",
    "max_time",
    "name",
    "organization",
    "participant_id",
    "post_0_phase_end_date",
    "post_0_phase_end_ms",
    "post_0_timezone",
    "post_0_window_inner_height",
    "post_0_window_inner_width",
    "procedure",
    "redcap_url",
    "repeat",
    "repository",
    "shuffle_1",
    "shuffle_2",
    "skip_quality",
    "start_message",
    "stimuli",
    "weight",
    "return_page",
    "completion_code",
    "prehashed_code",
  ]
  
  let demo_remove_fields = [
    // "completion_code",
    "condition_name",
    "condition_procedure",
    "condition_stimuli",
    "notes",
    "participant_browser",
    "phase_number",
    "phasetype",
    "platform",
    "post_0_fullscreen",
    "post_0_phase_start_ms",
    "post_0_rt_ms",
    "post_0_screen_height",
    "post_0_screen_width",
    "post_0_time",
    "post_0_us_date",
    // "return_page",
    "survey",
    "task_body_text",
    "task_title",
    "text",
    "username",
    "window_switch",
  ]

  // Function for dynamically sorting the dictionary by field_name or REDCap cannot import it
  function dynamicSort(property) {
    var sortOrder = 1;
    if(property[0] === "-") {
        sortOrder = -1;
        property = property.substr(1);
    }
    return function (a,b) {
        /* next line works with strings and numbers, 
         * and you may want to customize it to your needs
         */
        var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
        return result * sortOrder;
    }
  }
  
  function dynamicSortMultiple() {
    /*
     * save the arguments object as it will be overwritten
     * note that arguments object is an array-like object
     * consisting of the names of the properties to sort by
     */
    var props = arguments;
    return function (obj1, obj2) {
        var i = 0, result = 0, numberOfProperties = props.length;
        /* try getting a different result from 0 (equal)
         * as long as we have extra properties to compare
         */
        while(result === 0 && i < numberOfProperties) {
            result = dynamicSort(props[i])(obj1, obj2);
            i++;
        }
        return result;
    }
  }