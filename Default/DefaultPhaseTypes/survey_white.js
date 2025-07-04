/*
 * Collector Survey 3.5.2
 * Authors: Dr. Anthony Haffey & Chris Dobson
 */

/* 
 * Setup a prepend variable
 */
var survey_prepend = "survey_";
var survey_pages_used;
var current_table_no = 0;
var next_table_no = 0;
var tableCount;
var this_element_label;
var item_name;
var response = [];
var lastTable = false;

/*
* detect if testing or not
*/
if (typeof module !== "undefined") {
  // give message to developer during testing
  function appropriate_message(this_message) {
    console.log(this_message);
  }
} else {
// give message to participant
  function appropriate_message(this_message) {
    bootbox.alert(this_message);
  }
}

var home_dir = "";

var org_repo;
if(typeof(parent.parent.Project) !== "undefined"){
switch (parent.parent.Project.get_vars.platform) {
  case "simulateonline":
  case "localhost":
  case "preview":
    org_repo = parent.parent.project_json.location.split("/");
    home_dir = parent.parent.CElectron.git.locate_repo({
      org: org_repo[0],
      repo: org_repo[1],
    });
    break;
  default:
    home_dir = "..";
    break;
}
}

/*
* this survey_js object is required to make testing works
*/
survey_js = {};

phasetype_obj = {};

types_list = [
"checkbox",
"checkbox_vertical",
"checkbox_horizontal",
"date",
"dropdown",
"select",
"email",
"google_slide",
"jumbled",
"instruct",
"likert",
"number",
"page_break",
"para",
"radio",
"radio_vertical",
"radio_horizontal",
"redcap_pii",
"report_score",
"survey_break",
"text",
];
/*
* Retrieving settings
*/

if (typeof settings !== "undefined") {
settings = [settings];
} else {
settings = {};
}

/*
* vertical vs. horizontal tabs
*/

if (typeof settings.tab_hor_vert === "undefined" || settings.tab_hor_vert.toLowerCase() === "horizontal") {
settings.tab_hor_vert = "horizontal";
$("#survey_outline")
  .append(
    $("<div>").attr("id", "please_wait_div").html("Loading... Please wait")
  )
  .append(
    $("<div>")
      .addClass("needs-validation")
      .attr("id", "this_survey_id")
      .attr("novalidate", true)
  )
  .append(
    $("<div>")
      .attr("id", "survey_tabs")
      .addClass("border-top")
      .addClass("border-primary")
      .css("text-align", "right")
  )
} else if (settings.tab_hor_vert.toLowerCase() === "vertical") {
$("#" + survey_outline).append(
  $("<table>").append(
    $("<tr>")
      .append(
        $("<td>")
          .prop("valign", "top")
          .addClass("border-right")
          .addClass("border-primary")
          .append($("<div>").prop("id", "survey_tabs"))
      )
      .append(
        $("<td>")
          .append(
            $("<div>")
              .prop("id", "please_wait_div")
              .html("Please wait while survey is downloading")
          )
          .append(
            $("<div>")
              .prop("id", "this_survey_id")
              .addClass("needs-validation")
              .attr("novalidate", true)
          )
      )
  )
);
} else if (settings.tab_hor_vert.toLowerCase() === "none") {
$("#survey_outline")
  .append($("<div>").css("display", "none").prop("id", "survey_tabs"))
  .append($("<div>").html("Please wait while survey is downloading").prop("id", "please_wait_div"))
  .append($("<div>").class("needs-validation").prop("id", "this_survey_id").attr("novalidate", true));
} else {
  appropriate_message("If you are the researcher, please check the 'settings' for this survey. The input for 'tab_hor_vert' appears to be invalid. Please change it to 'horizontal' or 'vertical' or 'none' or remove 'tab_hot_vert' altogether from the settings, which will make the tabs invisible");
}

$("#everything").append(
$("<input>")
  .prop("id", "false_submit")
  .prop("name", "false_submit")
  .attr("type", "hidden")
  .val(0)
)

/*
* Defining objects
*/

page_break_management = {
  breaks_remaining: 0,
  breaks_index: 0,
};

proceed_object = {
  type: [],
  name: [],
  break_no: [],
};

scoring_object = {
scales: [],
scale_scores: [],
update_scales: function (this_survey) {
  headers = Object.keys(this_survey[0]);
  this.scales = headers.filter((elm) => elm.includes("score:"));
  var scales_html = "";
  this.scales.forEach(function (element) {
    element = element.replace(": ", ":");
    scales_html +=
      "<input name='" + 
      element.replace(/ |:/g, "_") +
      "' class='score_total " +
      element.replace(/ |:/g, "_") +
      "' disabled>";
  });
  $("#scales_span").html(scales_html);
},
};

survey_obj = {};

/*
* Element actions
*/

/* I THINK LEAVE THIS IS JUST IN CASE WE WANT TO REBUILD THIS FUNCTIONALITY
 
$(function() {
$( ".datepicker" ).datepicker({
dateFormat : 'mm/dd/yy',
changeMonth : true,
changeYear : true,
yearRange: '-100y:c+nn',
maxDate: '-1d'
});
});
*/

var blocks_obj = {};

$("#ExperimentContainer").css("transform", "scale(1,1)");

/* *************************************************** **  
** Functions for page breaks and button label swapping **
** *************************************************** */

function show_previous_button() {
  // this function will show the previous_button if the table number is anything other than Table0 (which is the first table)
  if (next_table_no === 0) {
    $('#previous_button').css('display', 'none');  
  } else {
    $('#previous_button').css('display', 'inline');
  }    
}

$("#previous_button").on("click", function () {
  current_table_no = $('table').filter(function() {
    return $(this).attr('style') === undefined || $(this).attr('style') === '';}).attr('id').replace("table", "");
  tableCount = $('table').length - 1; // this is reduced by 1 as the table numbering starts at 0
  next_table_no = eval(current_table_no) - eval(1);
  $(".table_break#table" + current_table_no).hide();
  $(".table_break#table" + next_table_no).show();
  $('.table_break#table'+ next_table_no).addClass("table_break_tabs");
  $('.table_break#table'+ current_table_no).removeClass("table_break_tabs");
  $(window).scrollTop(0);      
  $("#proceed_button").text("Next Page");
  show_previous_button();
});

$("#proceed_button").on("click", function () {

  // Find the visible table
  var visibleTable = $('table:visible');
                
  if (visibleTable.length === 0) {
      bootbox.alert("Please let the research know the survey system has broken and no page is visible.");
      return;
  } else {

    // Check if there is a visible table and a sequential table exists
    var tableIndex = -1;
    visibleTable.each(function() {
        var id = $(this).attr('id');
        var match = id.match(/table(\d+)/);
        if (match) {
            tableIndex = parseInt(match[1], 10);
            return false; // break out of the each loop
        }
    });

    if (tableIndex >= 0 && $('#table' + (tableIndex + 1)).length) {
        var hasVisibleBlock = false;
        var hasBlockName = false;
        $('tr[block_name]').each(function() {
            hasBlockName = true;
            if ($(this).is(':visible')) {
                hasVisibleBlock = true;
                return false; // break out of the each loop
            }
        });
    } else {
      lastTable = true;
      console.log("Sequential table does not exist");
    }
  }

  var proceed = true;
  current_table_no = $('table').filter(function() {return $(this).attr('style') === undefined || $(this).attr('style') === '';}).attr('id').replace("table", "");
  tableCount = $('table').length - 1; // this is reduced by 1 as the table numbering starts at 0
  next_table_no = eval(current_table_no) + eval(1);

  var response_elements = $("#table" + current_table_no).find("tr:visible .response_element");

  for (var i = 0; i < response_elements.length; i++) {
    [row_no, item_name] = retrieve_row_no_item_name(response_elements[i]);
    if (typeof survey_obj.data[row_no].optional !== "undefined") {
      var this_optional = survey_obj.data[row_no].optional.toLowerCase();

      // work out the minimum number of responses needed as set by the number of required questions
      if (this_optional.indexOf("no") !== -1) {
        this_optional = this_optional.split("-");
        if (this_optional.length === 1) {
          // default is that length needs to be at least 1
          var min_resp_length = 1;
        } else if (this_optional.length === 2) {
          var min_resp_length = this_optional[1];
        } else {
          appropriate_message("Error - you appear to have too many '-' characters in the 'optional' column");
          return false;
        }
      } else {
        min_resp_length = 0;
      }

      // store the number of responses we have received
      var quest_resp = isJSON($("#" + response_elements[i].id).val());

      // check if the number of responses is less than the number we expected.
      if (quest_resp.length < min_resp_length) {
        proceed = false; // this stops the survey from submitted/moving forward
        $("#" + response_elements[i].id.replace("response", "question")).removeClass("text-dark").removeClass("text-success").addClass("text-danger");
      } else {
        $("#" + response_elements[i].id.replace("response", "question")).removeClass("text-dark").removeClass("text-danger").addClass("text-success");
      }
    }
  }

  if (proceed) {
    if (hasBlockName) {
      if (hasVisibleBlock) {
          $(".table_break").hide();
          $(".table_break#table" + next_table_no).show(0);
          $('.table_break#table'+ next_table_no).addClass("table_break_tabs");
          $('.table_break#table'+ current_table_no).removeClass("table_break_tabs");
          $(window).scrollTop(0);
      } else {
          if (typeof Phase !== "undefined") {
            Phase.submit();
          } else {
            appropriate_message("You've finished! Click on the preview button to restart.");
          }
          return; // prevent moving to next table
      }
      if ($('.table_break_tabs').length > 0) {
        show_previous_button();
      }
      checkBlockNames();
    } else {

        if (page_break_management.breaks_remaining > 0) {
          if(lastTable) {
            if (typeof Phase !== "undefined") {
              Phase.submit();
            } else {
              appropriate_message("You've finished! Click on the preview button to restart.");
            }
          } else {
            $(".table_break").hide();
            $(".table_break#table" + next_table_no).show(0);
            $('.table_break#table'+ next_table_no).addClass("table_break_tabs");
            $('.table_break#table'+ current_table_no).removeClass("table_break_tabs");
            $(window).scrollTop(0);
          }
        } else {
          if (typeof Phase !== "undefined") {
            Phase.submit();
          } else {
            appropriate_message("You've finished! Click on the preview button to restart.");
          }
        }
        checkBlockNames();
      }

      if ($('.table_break_tabs').length > 0) {
        show_previous_button();
      }
  } else if (current_table_no > tableCount) {
    appropriate_message("Error - please contact the researcher about this problem, error 'Survey_001'.");
  } else {
    appropriate_message("You're missing some responses. Please fill in all the answers for the questions in red above.");
    var submit_fails = $("#false_submit").val();
    submit_fails++;
    $("#false_submit").val(submit_fails);
  }
});

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
* Functions
*/

 // Basic function for validating email fields {CGD}
 function validateEmail() {
  var email_input = $('input[type=email]').val();
    if (row["optional"].toLowerCase() === "no") {
      if(email_input == '' || email_input.indexOf('@') == -1 || email_input.indexOf('.') == -1) {
        appropriate_message("Sorry your email address is not valid<br>The proceed button will not work until your correct this");
        $("#proceed_button").css('pointer-events','none');
        $("#proceed_button").css('opacity','0.25');
      } else {
        $("#proceed_button").css('pointer-events','auto');
        $("#proceed_button").css('opacity','1');
      }
    } else {
      console.log("don't validate email field");
    }
}

function clean_item(this_item) {
if ((this_item.indexOf("'") !== -1) | (this_item.indexOf('"') !== -1)) {
  appropriate_message(
    "Please avoid apostraphes or quote marks in the responses the participant can give. These cause problems with smooth running of surveys. This occurs when you wrote:<br><br>" +
      this_item
  );
}
return this_item;
}

function generate_feedback_string(feedback_array, this_index, feedback_color, row, option_index) {
  if (feedback_array) {
    return $("<div>")
      .addClass("feedback_span")
      .addClass(row["item_name"].toLowerCase() + "_feedback_content")
      .attr("id", row["item_name"].toLowerCase() + "_feedback_" + option_index)
      .css("color", feedback_color[this_index])
      .css("display", "none") // Hide initially
      .html(feedback_array[this_index])[0].outerHTML;
  } else {
    return "";
  }
}

function get_feedback(row) {
  if (typeof row["feedback"] !== "undefined" && row["feedback"] !== "") {
    feedback_array = row["feedback"].split("|");
    if (typeof row["feedback_color"] === "undefined") {
      appropriate_message("The color for the feedback options has not been set. If you created this questionnaire, please add a column 'feedback_color' to your survey and separate the colors by a pipe (|) character.");
    } else {
      feedback_color = row["feedback_color"].split("|");
    }
  } else {
    feedback_array = null;
    feedback_color = "";
  }
  return [feedback_array, feedback_color];
  }

  function isJSON(str) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return str;
  }
}

survey_js.likert_update = function (this_element) {
  [row_no, item_name] = retrieve_row_no_item_name(this_element);
  $(".row_" + row_no).removeClass("active").removeClass("btn-primary").addClass("btn-outline-primary");
  $(this_element).removeClass("btn-outline-primary").addClass("btn-primary");
  response_check(this_element);
};

function hide_blocks(block_names, element_name){
  if(typeof(block_names) !== "undefined" && block_names !== ""){
    block_names.split(" ").forEach(function(block_name){
      $("[block_name='" + block_name+"']").hide();
      blocks_obj[block_name] = false;
    });  
  }
  // The code below is needed to make sure that radio/checkbox inputs aren't hidden accidently as the above code is a bit harsh
  var element_name = $("td input, td select, td select option");
  element_name.show();
  checkBlockNames();
}

function load_survey(survey, survey_outline) {
/*
 * are we in preview?
 */
if (typeof survey === "object") {
  survey_content = survey;
} else if (typeof parent.collector_survey_preview !== "undefined") {
  survey_content = survey;
} else if (
  typeof parent.master !== "undefined" &&
  parent.master.surveys.preview
) {
  survey_content = survey;
  survey_obj.phasetypes = parent.master.phasetypes.user;
} else {
  survey = survey.toLowerCase().replace(".csv", "") + ".csv";

  if (
    typeof parent.parent.project_json.surveys !== "undefined" &&
    typeof parent.parent.project_json.surveys[survey] !== "undefined"
  ) {
    survey_content = parent.parent.project_json.surveys[survey];
    survey_obj.phasetypes = parent.parent.project_json.phasetypes;
  } else if (
    typeof parent.parent.project_json.surveys !== "undefined" &&
    typeof parent.parent.project_json.surveys[survey.replace(".csv", "")]
  ) {
    survey_content =
      parent.parent.project_json.surveys[survey.replace(".csv", "")];
    survey_obj.phasetypes = parent.parent.project_json.phasetypes;
  } else {
    appropriate_message("Survey " + survey + " doesn't appear to exist");
  }
}
process_returned_questionnaire(survey_content, survey_outline);
}

function process_question(row, row_no) {

  //row.values = row.values == "" ? row.answers : row.values;
  if (row["type"] === "page_break") {
    page_break_management.breaks_remaining++;
    // survey_pages_used = true;
    question_td = "</tr></table><table id='table" + page_break_management.breaks_remaining + "' style='display:none' class='table_break page_break'></tr>";
  } else {
    if ((typeof row["values"] !== "undefined") & (typeof row["values"] !== "function")) {
      value_array = row["values"].split("|"); //to address microsoft edge issue.
    } else {
      value_array = "";
    }

    if (row["item_name"].indexOf(" ") !== -1) {
      appropriate_message("Please note that the 'item name' '" + row["item_name"] + "' is invalid because it has at least one space. Please use underscores instead of spaces. If you're not the creator of this task, please contact the person who created it.");
    }

    /*
    * class for scoring
    */

    var this_class = "";
    for (var i = 0; i < scoring_object.scales.length; i++) {
      if (row[scoring_object.scales[i].toLowerCase()] === "1") {
        this_class +=
          scoring_object.scales[i]
            .toLowerCase()
            .replace("score: ", "")
            .replace(/ |-/, "") + " ";
      }
      if (row[scoring_object.scales[i].toLowerCase()] === "r1") {
        this_class +=
          scoring_object.scales[i]
            .toLowerCase()
            .replace("score: ", "")
            .replace(" ", "_") + "-r1 ";
      }
    }

    /*
    * adding to row to help with "write" function
    */
    var row_x = JSON.parse(JSON.stringify(row));
    row_x["row_no"] = row_no;
    row_x["this_class"] = this_class;

    [feedback_array, feedback_color] = get_feedback(row);

    var survey_id = survey_prepend + row["item_name"].toLowerCase();

    // This sets up the hidden inputs for each question
    question_td =
      $("<input>")
        .attr("type", "hidden")
        .addClass("response_element")
        .addClass("row_" + row_no)
        .prop("id", survey_id + "_response")
        .prop("name", survey_id + "_response")
        .val("")[0].outerHTML;  
    question_td = question_td +=
      $("<input>")
        .attr("type", "hidden")
        .prop("id", survey_id + "_value")
        .prop("name", survey_id + "_value") //<------------ Ant turned this off?? Why??
        .val("")[0].outerHTML;

    /*
    * Survey settings
    */
    [row_ques_perc, row_resp_perc] = row_perc(row["question_width"]);

    if (typeof settings.feedback_before_response === "undefined") {
      settings.feedback_before_response = true;
    }

    if (typeof settings.lock_after_feedback === "undefined") {
      settings.lock_after_feedback = false;
    } else {
      settings.lock_after_feedback = true;
    }

    if (typeof row["type"] === "undefined") {
      return false;
    }

    switch (row["type"].toLowerCase()) {
      case "checkbox":
      case "checkbox_vertical":
        question_td += write("checkbox_vertical", row_x);
        break;
      case "checkbox_horizontal":
        question_td += write("checkbox_horizontal", row_x);
        break;
      case "date":
        question_td += write("date", row_x);
        break;
      case "dropdown":
      case "select":
        question_td += write("dropdown", row_x);
        break;
      case "email":
        question_td += write("email", row_x);
        break;
      case "google_slide":
      case "jumbled":
      case "instruct":
        // these are defined elsewhere to take the whole row
        break;
      case "likert":
        question_td += write("likert", row_x);
        break;
      case "number":
        question_td += write("number", row_x);
        break;
      case "para":
        question_td += write("para", row_x);
        break;
      case "radio":
      case "radio_vertical":
        question_td += write("radio_vertical", row_x);
        break;
      case "radio_horizontal":
        question_td += write("radio_horizontal", row_x);
        break;
      case "redcap_pii":
          break;
      case "report_score":
        question_td.append(
          $("<input>")
            .addClass("form-control")
            .addClass("score_" + row["item_name"])
            .addClass(row["item_name"] + "_item")
            .addClass("row_" + row_no)
            .attr("disabled", true)
            .attr("type", "text")
            .prop("name", survey_prepend + row["item_name"].toLowerCase())
        );
        break;
      case "text":
        question_td += write("text", row_x);
        break;
      default:
        /*
        * Load from the user's phasetype
        */

        question_td += phasetype_obj[row.type];

        break;
    }

    // Generate the feedback button if feedback_array exists
    if (feedback_array) { //qwertyu
      var feedback_button = $("<button>")
        .addClass("btn btn-outline-info feedback_btn")
        .addClass(row["item_name"] + "_item")
        .addClass("row_" + row_no)
        .html("Show Feedback")
        .attr("onclick", "reveal_answers(this);")
        .prop("id", "reveal_" + row["item_name"].toLowerCase() + "_feedback")
        .css("margin-top", "10px") // Adding margin-top
        .hide(); // Initially hide the feedback button

      question_td += feedback_button[0].outerHTML;
    }

    // Generate feedback content for each option and hide it initially
  //   for (var i = 0; i < value_array.length; i++) {
  //     var feedback_content = generate_feedback_string(feedback_array, i, feedback_color, row, i);
  //     question_td += feedback_content;
  //   }
  //   question_td = question_td;
  }

  if (typeof row["type"] === "undefined") {
    return "";
  } else {
    if (row["type"].toLowerCase() === "instruct") {
      row_html = write("instruct", row);
    } else if (row["type"].toLowerCase() === "jumbled") {
      //row_html  = question_td + write("jumbled",row); <-- this is better, but being paused for placement work Anthony is doing
      row_html = write("jumbled", row);
    } else if (row["type"].toLowerCase() === "likert") {
      if (typeof row["side_by_side"] !== "undefined" && row["side_by_side"].toLowerCase() === "yes") {
        var row_html =
          $("<td>")
            .addClass("text-primary")
            .css("text-align", "right")
            .css("width", row_ques_perc)
            .html(row["text"])
            .prop("id", survey_prepend + row["item_name"].toLowerCase().replace(" ", "_") + "_question")[0]
            .outerHTML + $("<td>").html(question_td)[0].outerHTML;
      } else {    
        var row_html =
          $("<tr>")
            .append($("<td>")
            .attr("colspan", 2)
            .html(row["text"])
            .attr("class", "text-primary")
            .attr("id", survey_id + "_question"))[0]
            .outerHTML +
          $("<tr>").append(
            $("<td>")
              .attr("colspan", 2)
              .attr("align", "center")
              .html(question_td))[0].outerHTML;
      }
    // } else if (row["type"].toLowerCase() === "google_slide") {
    //   var row_html = $("<td>")
    //     .attr("colspan", 2)
    //     .html(row["text"])[0].outerHTML;

    //   //var row_html="<td colspan='2'>"+row["text"]+"</label></td>";
    } else if (typeof row["no_text"] !== "undefined" && row["no_text"] === "on") {
      var row_html = $("<td>")
        .attr("colspan", 2)
        .html(question_td)[0].outerHTML;

      //var row_html="<td colspan='2'>"+question_td+"</td>";
    } else if (row["type"].toLowerCase() === "page_break") {
        row_html = question_td;
    } else {
        var row_html =
          $("<tr>")
            .append($("<td>")  
              .addClass("text-primary")
              .css("text-align", "left")
              .css("width", row_ques_perc)
              .prop("id",survey_prepend + row["item_name"].toLowerCase().replace(" ", "_") + "_question")
              .html(row["text"] + question_td))[0].outerHTML;
    }
  }
  
  if (typeof row["optional"] !== "undefined") {
    if (row["optional"].toLowerCase() === "no") {
      proceed_object.name.push(row["item_name"]);
      proceed_object.type.push(row["type"]);
      //proceed_object.break_no.push(page_break_management.breaks_remaining);
    }
  }
  if (
    typeof row["shuffle_question"] === "undefined" ||
    row["shuffle_question"].toLowerCase() === "off"
  ) {
    this_shuffle = "none";
  } else {
    this_shuffle = row["shuffle_question"];
  }
  return [row_html, this_shuffle];
}


function process_score(row_no,values_col,this_response,item,values_reverse) {
  item_values = survey_obj.data[row_no][values_col].split("|");
  if (typeof values_reverse !== "undefined" && values_reverse === "r") {
    item_values.reverse();
  }
  item_answers = survey_obj.data[row_no]["values"].split("|");
  var this_value = item_values[item_answers.indexOf(this_response)];
  $(survey_prepend + item + "_score").val(this_value);
  if (typeof this_value !== "undefined") {
    return parseFloat(this_value);
  }
}

function process_returned_questionnaire(data, survey_outline) {
/*
 * trim the data if it has a blank final row
 */
if (data[data.length - 1].length < data[0].length) {
  data.pop();
}
survey_obj.data = data;
survey_obj.data = Papa.unparse(survey_obj.data);
survey_obj.data = parent.parent.Collector.PapaParsed(survey_obj.data);

/*
 * detect if there are phasetypes that need to be loaded
 */

var phasetypes = survey_obj.data.filter(function (row) {
  return types_list.indexOf(row.type.toLowerCase()) === -1;
});

function load_phasetypes(phasetypes) {
  if (phasetypes.length > 0) {
    var phasetype = phasetypes.pop().type;

    $.get(
      home_dir + "/User/PhaseTypes/" + phasetype + ".html",
      function (this_html) {
        this_html = this_html.replaceAll("../User/", home_dir + "/User/");

        phasetype_obj[phasetype] = this_html;
        load_phasetypes(phasetypes);
      }
    );
  } else {
    survey_obj.scales = {};
    var col_headers = Object.keys(survey_obj.data[0]);
    col_headers.forEach(function (header) {
      if (header.indexOf("score:") === 0) {
        var original_header = header;
        header = header.replace("score: ", "");
        header = header.replace("score:", "");
        survey_obj.scales[header] = {};
        survey_obj.scales[header].questions = {};

        for (var i = 1; i < survey_obj.data.length; i++) {
          row = survey_obj.data[i];
          if (
            row[original_header] !== "" &&
            typeof row[original_header] !== "undefined"
          ) {
            survey_obj.scales[header].questions[i] = row[original_header];
          }
        }
      }
    });
    write_survey(survey_obj.data, survey_outline);
    $("#please_wait_div").hide();
    $("#proceed_button").show();
    //$("html, body").animate({scrollTop: $("#" + survey_outline).offset().top,},0);

  }
}
load_phasetypes(phasetypes);
}

function row_perc(this_rat) {
if (typeof this_rat === "undefined") {
  row_resp_perc = "50%";
  row_ques_perc = "100%";
} else {
  row_resp_perc = parseFloat(100 - this_rat.replace("%", "")) + "%";
  row_ques_perc = parseFloat(this_rat.replace("%", "")) + "%";
}
return [row_ques_perc, row_resp_perc];
}

function response_check(submitted_element) {
  if (submitted_element.type === "select-one" || submitted_element.type === "radio") {
    // hiding blocks, current cannot handle two independent blocks but can handle a block embedded within another qwwerty

    if (Object.keys(row).includes('block')) {
      if($('[block_name]').length > 0) {
        show_block($("#" + submitted_element.id).attr('block_name') || $('#' + submitted_element.id + ' option:selected').attr('block_name'));
        hide_blocks($("#" + submitted_element.id).attr('hide_blocks') || $('#' + submitted_element.id + ' option:selected').attr('hide_blocks'));
      }
    } else {
      // do nothing as the survey doesn't contain branching
    }
  } else {
    // do nothing as the elemet cannot be used for branching
  }

  switch (submitted_element.type) {
    case "checkbox":   
      var checked_responses = $("[name='" + submitted_element.name + "']:checked");
      var checked_text = $('input[id="' + submitted_element.id + '"]').next('label').text();
      
      if (response.includes(checked_text)) {
        response.splice( $.inArray(checked_text, response), 1 );
      } else {
        response.push(checked_text);
      }

      if (checked_responses.length) {
        //i.e. more than 0
        var values = [];
        for (var i = 0; i < checked_responses.length; i++) {
          values.push(checked_responses[i].value);
        }    

        $("#" + submitted_element.name + "_value").val(JSON.stringify(values));
        $("#" + submitted_element.name + "_response").val(JSON.stringify(response));
      } else {
        $("#" + submitted_element.name + "_value").val("");
        $("#" + submitted_element.name + "_response").val("");
      }
      break;

    case "button":
      $("#" + submitted_element.name + "_response").val(submitted_element.value);
      break;
    case "select-one": // I have no idea why, but this has to be with dropdown or the dropdown doesn't work at storing both value and response options!
    case "dropdown":
      this_element_label = $('#' + submitted_element.id + ' option:selected').text(); 
      $("#" + submitted_element.name + "_response").val(this_element_label);
      $("#" + submitted_element.name + "_value").val(submitted_element.value);  
      break;
    case "number":
    case "email":
    case "radio":
      this_element_label = $('label[for="'+submitted_element.id+'"]').text();
      $("#" + submitted_element.name + "_response").val(this_element_label);
      $("#" + submitted_element.name + "_value").val(submitted_element.value);  
      break;
    case "text":
    case "textarea":
      $("#" + submitted_element.name + "_response").val(submitted_element.value);
      break;
  }

  // Show the feedback button after submission
  if (submitted_element.type === "radio" || submitted_element.type === "checkbox" || submitted_element.type === "select-one" || submitted_element.type === "dropdown") {
    var element_id = submitted_element.name.replace(survey_prepend, "") + "_feedback";
    $("#reveal_" + element_id).show(); // Show the feedback button
  }

  update_score(); 
}

var item_name;

function retrieve_row_no_item_name(this_element) {
  var these_classes = this_element.className.split(" ");
  var row_no;
  these_classes.forEach(function (this_class) {
    if (this_class.indexOf("row_") > -1) {
      row_no = this_class.replace("row_", "");
    }
    if (this_class.indexOf("_item") > -1) {
      item_name = this_class.replace("_item", "").toLowerCase();
    }
  });
  return [row_no, item_name];
}

function reveal_answers(this_element) {
  
  var item_name = this_element.id.replace("reveal_", "").replace("_feedback", "");
  var response_parent = $("#" + survey_prepend + item_name + "_response").val() !== "";
  var selected_value = $("#" + survey_prepend + item_name + "_value").val();
  var response_buttons = survey_prepend + item_name;
  
  // Check if the selected value was a checkbox array
  if (typeof selected_value === 'string' && selected_value.startsWith('[') && selected_value.endsWith(']')) {
    // Convert string representation of array to an actual array
    selected_value = JSON.parse(selected_value);
  }

  if (Array.isArray(selected_value)) {
    var modified_values = selected_value.map(function(value) { // Change selected_values to selected_value
      return (Number(value) - 1);
    });
    var modified_values_string = modified_values;
    selected_value = modified_values_string;
  } else {
    selected_value = selected_value - 1;
    selected_value = selected_value.toString();
  }

  if (settings.feedback_before_response === false && !response_parent) {
    appropriate_message("Please respond before trying to reveal the feedback.");
  } else {
    var feedback_container = $("#" + item_name + "_feedback_container");
    if (feedback_container.length === 0) {
      feedback_container = $("<div>")
        .attr("id", item_name + "_feedback_container")
        .addClass("feedback_container")
        .insertAfter(this_element);
    }

    if (Array.isArray(selected_value)) {
      var combined_feedback_content = "";
  
      selected_value.forEach(function(value, index) {
          var feedback_content = $("#" + item_name + "_feedback_" + value).html();
          var response_div_color = $("#" + item_name + "_feedback_" + value).css("color");
          
          // Append the feedback content with its own color
          combined_feedback_content += "<span style='color:" + response_div_color + "'>" + feedback_content + "</span>";
          if (index < selected_value.length - 1) {
              combined_feedback_content += ", ";
          }
      });
      
      feedback_container.html(combined_feedback_content).show(500);
    } else {
        var feedback_content = $("#" + item_name + "_feedback_" + selected_value).html();
        var response_div_color = $("#" + item_name + "_feedback_" + selected_value).css("color");
        feedback_container.html(feedback_content).css("color", response_div_color).show(500);
    }

    if ($(this_element).hasClass("btn-outline-info")) {
      if (settings.lock_after_feedback) {
        // Lock responses if required
        $(`input[name='` + response_buttons + `'], select[name='` + response_buttons + `']`).prop('disabled', true);

        $(this_element).addClass("btn-info").removeClass("btn-outline-info").html("Answer Locked");
        $(this_element).addClass("disabled");
      } else {
        $(this_element).html("Hide Feedback").removeClass("btn-outline-info").addClass("btn-info");
      }
    } else {
      feedback_container.hide(500);
      $(this_element).html("Show Feedback").addClass("btn-outline-info").removeClass("btn-info");
    }
  }
}

function show_block(block_name){
  if(block_name !== ""){
    $("[block_name='" + block_name+"']").show();
    blocks_obj[block_name] = true;
  }
  checkBlockNames();
}

// http://stackoverflow.com/questions/962802#962890
function shuffle(array) {
var tmp,
  current,
  top = array.length;
if (top)
  while (--top) {
    current = Math.floor(Math.random() * (top + 1));
    tmp = array[current];
    array[current] = array[top];
    array[top] = tmp;
  }
return array;
}

function shuffle_answers(row) {
if (
  typeof row["shuffle_answers"] !== "undefined" &&
  row["shuffle_answers"].toLowerCase() === "yes"
) {
  var answers = row["answers"].split("|");
  order = shuffle([...Array(answers.length).keys()]);

  var ordered_answers = order.map(function (position) {
    return answers[position];
  });
  row["answers"] = ordered_answers.join("|");

  if (row["values"].indexOf("|") !== -1) {
    var values = row["values"].split("|");
    var ordered_values = order.map(function (position) {
      return values[position];
    });
    row["values"] = ordered_values.join("|");
  }
}
return row;
}

function update_score() {
var scales = Object.keys(survey_obj.scales);
scales.forEach(function (scale) {
  this_scale = survey_obj.scales[scale];
  var questions = Object.keys(this_scale.questions);
  var this_score = 0;
  complete_score = true;

  questions.forEach(function (row_no) {
    var item = survey_obj.data[row_no].item_name.toLowerCase();
    var this_response = $("#" + survey_prepend + item + "_value").val();
    var normal_reverse = this_scale.questions[row_no];
    if (normal_reverse.indexOf("-") === -1) {
      var multiplier = parseFloat(normal_reverse.replace("r", ""));
      if (normal_reverse.indexOf("r") === 0) {
        //reverse the values
        this_value = process_score(row_no, "values", this_response, item, "r");
      } else {
        this_value = process_score(row_no, "values", this_response, item);
      }
    } else {
      values_reverse = normal_reverse.split("-");
      values_col = values_reverse[0].toLowerCase();
      normal_reverse = values_reverse[1];
      var multiplier = parseFloat(normal_reverse.replace("r", ""));

      if (normal_reverse.indexOf("r") === 0) {
        //reverse the values
        this_value = process_score(row_no, values_col, this_response, item, "r");
      } else {
        this_value = process_score(row_no, values_col, this_response, item);
      }
    }

    if (typeof this_value !== "undefined") {
      this_score += multiplier * this_value;
    } else {
      complete_score = false;
    }
  });
  if (complete_score) {
    $(".score_" + scale)
      .addClass("bg-success")
      .removeClass("bg-danger")
      .addClass("text-light")
      .prop("title", "All relevant questions have been answered");
  } else {
    $(".score_" + scale)
      .removeClass("text-success")
      .addClass("bg-danger")
      .addClass("text-light")
      .prop("title", "At least one relevant questions has NOT been answered");
  }
  $(".score_" + scale).val(this_score);
});
}

var branches;
function check_branching(values) {
  if(typeof(row["branch"]) == "undefined"){
    branches = Array(values.length);
  } else {
    branches = row["branch"].split("|");
  }
}

// CREATING THE DIFFERENT RESPONSE TYPES
function write(type, row) {
  var this_html = "";
  [feedback_array, feedback_color] = get_feedback(row);

  row = shuffle_answers(row);
  row["item_name"] = row["item_name"].toLowerCase();

  // Horizontal Checkbox
  if (type === "checkbox_horizontal") {
    var options = row["answers"].split("|");
    var values = row["values"].split("|");
    var this_table = $("<table>");
    this_row = this_table[0].insertRow();
    for (var i = 0; i < options.length; i++) {
      var this_cell = this_row.insertCell();
      var this_div = $("<div>");
      this_div
        .addClass("custom-control")
        .addClass("custom-checkbox")
        .addClass("checkboxes_h");
      var this_input = $("<input>");
      this_input[0].type = "checkbox";
      this_input[0].id = row["item_name"] + i;
      this_input[0].value = values[i];
      this_input[0].name = survey_prepend + row["item_name"];
      this_input
        .addClass("custom-control-input")
        .addClass("response")
        .addClass(row["this_class"])
        .addClass(row["custom-control"])
        .addClass(row["custom-checkbox"])
        .addClass(row["item_name"] + "_item")
        .addClass("row_" + row["row_no"])
        .attr("block_name",'')
        .attr("hide_blocks",'');
      var this_label = $("<label>");
      this_label[0].htmlFor = row["item_name"] + i;
      this_label[0].innerText = options[i];
      this_label.addClass("custom-control-label");
      this_div
        .append(this_input)
        .append(this_label)
        .append(feedback_string);
      this_cell.innerHTML = this_div[0].outerHTML;
    }
    this_html += this_table[0].outerHTML;

    // Vertical Checkbox
  } else if (type === "checkbox_vertical") {
    var options = row["answers"].split("|");
    var values = row["values"].split("|");
    for (var i = 0; i < options.length; i++) {
      feedback_string = generate_feedback_string(feedback_array,i,feedback_color,row, i);
      var this_div = $("<div>");
      this_div
        .addClass("custom-control")
        .addClass("custom-checkbox");
      var this_checkbox = $("<input>");
      this_checkbox[0].id = row["item_name"] + i;
      this_checkbox[0].value = values[i];
      this_checkbox[0].type = "checkbox";
      this_checkbox[0].name = survey_prepend + row["item_name"].toLowerCase();
      this_checkbox
        .addClass("custom-control-input")
        .addClass(row["this_class"])
        .addClass("custom-control")
        .addClass("custom-checkbox")
        .addClass("response")
        .addClass(row["item_name"] + "_item_row")
        .attr("block_name",'')
        .attr("hide_blocks",'');
      var this_label = $("<label>");
      this_label[0].htmlFor = row["item_name"] + i;
      this_label[0].innerHTML = options[i];
      this_label.addClass("custom-control-label");
      this_div
        .append(this_checkbox)
        .append(this_label)
        .append(feedback_string);
      this_html += this_div[0].outerHTML;
    }

    // Custom Checkbox??  <--- Not currently working
    // if (typeof row["other"] !== "undefined" && row["other"].toLowerCase() === "yes") {
    //   var this_div = $("<div>");
    //   this_div.addClass("custom-control").addClass("custom-checkbox");
    //   var this_checkbox = $("<input>");
    //   this_checkbox[0].id = row["item_name"] + "_other";
    //   this_checkbox[0].value = "Other";
    //   this_checkbox[0].type = "checkbox";
    //   this_checkbox[0].name = survey_prepend + row["item_name"].toLowerCase();
    //   this_checkbox
    //     .addClass("custom-control-input")
    //     .addClass(row["this_class"])
    //     .addClass("custom-control")
    //     .addClass("custom-checkbox")
    //     .addClass("response")
    //     .addClass(row["item_name"] + "_item_row")
    //     .attr("block_name",'')
    //     .attr("hide_blocks",'');
    //   var this_label = $("<label>");
    //   this_label[0].htmlFor = row["item_name"] + "_other";
    //   this_label[0].innerHTML = "Other";
    //   this_label.addClass("custom-control-label");
    //   this_div.append(this_checkbox).append(this_label);

    //   this_html += this_div[0].outerHTML;

    //   var text_input = $("<input>");
    //   text_input.addClass("form-control");
    //   text_input.attr(
    //     "placeholder",
    //     "(Please specify if you selected 'Other')"
    //   );
    //   text_input[0].name = survey_prepend + row["item_name"].toLowerCase() + "_other";
    //   this_html += text_input[0].outerHTML;
    // }

    // Date <--- Not currently working
  // } else if (type === "date") {
  //   var input = $("<input>");
  //   input
  //     .addClass("response")
  //     .addClass("custom-control")
  //     .addClass("datepicker")
  //     .addClass("date")
  //     .addClass(row["item_name"] + "_item")
  //     .addClass("row_" + row["row_no"])
  //     .attr("name", survey_prepend + row["item_name"])
  //     .attr("type", "text")
  //     .attr("block_name",'')
  //     .attr("hide_blocks",'');

    // Dropdown
  } else if (type === "dropdown") {
    var hide_blocks = [];
    var options = row["answers"].split("|");
    var values = row["values"].split("|");
    check_branching(values); // <---------------------------------------------

    var htmlCollection = [];
    var this_dropdown_container = $("<div>");
    var feedback_collated = "";
    for (var i = 0; i < options.length; i++) {
      var feedback_string = generate_feedback_string(feedback_array, i, feedback_color, row, i);
      feedback_collated += feedback_string;

      // create hide blocks array  // <--------------------------------------------- // Maybe a function?
      for (var j = 0; j < branches.length; j++) {
        if (i !== j) {
          hide_blocks.push(branches[j]);
        }
      }
    }
    var this_dropdown = $("<select>");
    this_dropdown[0].id = survey_prepend + row["item_name"];
    this_dropdown
      .addClass("form-select")
      .addClass("response")
      .addClass("txt-primary")
      .addClass(row["item_name"] + "_item")
      .addClass("row_" + row["row_no"])
      .addClass("collector_button")
      .attr("type", "dropdown")
      .attr("name", survey_prepend + row["item_name"])
      .css("margin", "0px")
      .css("width", "auto");

    // this will be necessary to tidy up jumbled sentences
    if (typeof(row["item_name_old"]) !== "undefined") {
      this_dropdown.addClass(row["item_name_old"] + "_item");
    }

    this_dropdown.append("<option selected disabled hidden>-- no option selected --</option>");

    options.forEach(function (this_option, index) {
      const this_value = values[index];
      const this_branch = branches[index];
      const this_hideblock = hide_blocks[index];
      // Create option element
      var optionElement = `<option type="dropdown" value="${this_value}" block_name="${this_branch}" hide_blocks="${this_hideblock}">${this_option}</option>`;
      this_dropdown.append(optionElement);
    });

    this_dropdown_container
      .append(this_dropdown)
      .append(feedback_collated);

    var this_html = this_dropdown_container[0].outerHTML;

    // Email
  } else if (type === "email") {
    var this_input = $("<input>");
    this_input
      .addClass("form-control")
      .addClass("response")
      .addClass(row["item_name"] + "_item row_" + row["row_no"])
      .attr("type", "email")
      .attr("name", survey_prepend + row["item_name"])
      .attr("onblur", "validateEmail()")
      .prop("id", survey_prepend + row["item_name"] + "_response" + " emailInput")
      .attr("block_name",'')
      .attr("hide_blocks",'');
      this_html += this_input[0].outerHTML;
  } else if (type === "instruct") {
    this_html += "<tr><td colspan='2' block_name hide_block>" + row["text"] + "</td></tr>";
  } else if (type === "jumbled") {
    var this_td = $("<td>");
    this_td.attr("colspan", 2);

    var this_div = $("<div>");
    this_div
      .addClass("form-inline")
      .addClass("bg-secondary")
      .addClass("text-white")
      .css("width", "100%")
      .css("padding", "20px")
      .css("margin", "20px")
      .css("border-radius", "5px");

    var question = row["text"].split("|");
    questions_html = question
      .map(function (text, index) {
        if (index === question.length - 1) {
          return text;
        } else {
          var row_x = row;
          row_x["item_name_old"] = row_x["item_name"];
          row_x["item_name"] = row_x["item_name"] + "_" + index;
          var row_html =
            text +
            write("dropdown", row_x).replace("margin: 0px", "margin: 5px");
          row_x["item_name"] = row_x["item_name_old"];
          return row_html;
        }
      })
      .join("");

    this_td.append(this_div);
    this_div.append(questions_html);

    this_html = this_td[0].outerHTML;

    // Likert Scales
  } else if (type === "likert") {
    // set styles
    if (typeof row["btn_width"] === "undefined") {
      row["btn_width"] = "auto";
    }
    if (typeof row["btn_font_size"] === "undefined") {
      row["btn_font_size"] = "auto";
    }
    if (typeof row["side_width"] === "undefined") {
      var side_width = "auto";
    }

    // create and build these elements
    var this_div = $("<div>");
    if (typeof row["side_text"] !== "undefined" && row["side_text"] !== "") {
      side_text = row["side_text"].split("|");
      side_text = side_text.map(function (this_side) {
        var this_span = $("<span>");
        this_span
          .css("width", side_width)
          .css("padding", "0 20px 0 20px")
          .addClass("text-primary")
          // .html("<b>" + this_side + "</b>");
          .html(this_side);
        return this_span[0].outerHTML;
      });
    } else {
      side_text = ["", ""];
    }

    this_div
      .addClass("btn-group")
      .addClass("btn-group-toggle")
      .append(side_text[0])
      .attr("data-togle", "buttons");

    var options = row["answers"].split("|");
    var values = row["values"].split("|");

    check_branching(values)

    for (i = 0; i < options.length; i++) {
      feedback_string = generate_feedback_string(feedback_array,i,feedback_color,row,i);
      var this_input = $("<input>");
      // create hide blocks array <---------------------------------------
      var hide_blocks = [];
      for(j=0; j < branches.length; j++){
        if(i !== j){
          hide_blocks.push(branches[j]);
        }
      }
      hide_blocks = hide_blocks.join(" ");

      this_input
        .attr("type", "radio")  
        .attr("name", survey_prepend + row["item_name"])
        .attr("autocomplete", "off")
        .attr("id", "likert_" + row["row_no"] + "_" + i)
        .attr("onclick", "survey_js.likert_update(this);")
        .attr("value", values[i])
        .attr("block_name", branches[i])
        .attr("hide_blocks", hide_blocks)
        .addClass("btn-check")
      this_div.append(this_input);
      var this_label = $("<label>");
      this_label
        .addClass("btn")
        .addClass("btn-outline-primary")
        .attr("for", "likert_" + row["row_no"] + "_" + i)
        .css("width", row["btn_width"])
        .css("font-size", row["btn_font_size"])
        .html(clean_item(options[i]));
      this_div
      .append(this_label)
      .append(feedback_string);
    }
    this_div.append(side_text[1]);
    this_html += this_div[0].outerHTML;

    // Number
  } else if (type === "number") { 
      var this_input = $("<input>");
      this_input[0].type = "number";
      this_input[0].name = survey_prepend + row["item_name"];
      this_input
        .addClass("response")
        .addClass("form-control")
        .addClass(row["item_name"] + "_item row_" + row["row_no"])
        .attr("block_name",'')
        .attr("hide_blocks",'')
    this_html += this_input[0].outerHTML;

    // Paragraph Text Area
  } else if (type === "para") {
    var this_textarea = $("<textarea>");
    this_textarea[0].name = survey_prepend + row["item_name"];
    this_textarea
      .addClass(row["item_name"] + "_item row_" + row["row_no"])
      .addClass("response");
    this_textarea.css("width", "100%").css("height", "200px");
    this_html += this_textarea[0].outerHTML;

    // Horiztonal Radio Buttons
  } else if (type === "radio_horizontal") {
    var options = row["answers"].split("|");
    var values = row["values"].split("|");
    check_branching(values); // <---------------------------------------------
    var this_table = $("<table>");
    this_row = this_table[0].insertRow();
    for (var i = 0; i < options.length; i++) {
      feedback_string = generate_feedback_string(feedback_array,i,feedback_color,row,i);
      var this_cell = this_row.insertCell();
      var this_div = $("<div>");
      this_div
        .addClass("custom-control")
        .addClass("custom-radio")
        .addClass("checkboxes_h");

      // create hide blocks array  // <---------------------------------------------
      var hide_blocks = [];
      for(j=0; j < branches.length; j++){
        if(i !== j){
          hide_blocks.push(branches[j]);
        }
      }
      hide_blocks = hide_blocks.join(" ");  // <---------------------------------------------
      
      var this_label = $("<label>");
      this_label[0].htmlFor = row["item_name"] + i;
      this_label.addClass("custom-control-label").addClass("radioLabelHolder");
      
      this_label.append(
        $("<input>")
          .prop("type", "radio")
          .prop("id", row["item_name"] + i)
          .prop("value", values[i])
          .prop("name", survey_prepend + row["item_name"])
          .addClass("custom-control-input")
          .addClass(row["this_class"])
          .addClass("custom-control")
          .addClass("custom-radio")
          .addClass("response")
          .addClass("option-input radio")
          .addClass(row["item_name"] + "_item_row_" + row["row_no"])
          .attr("block_name", branches[i])
          .attr("hide_blocks", hide_blocks)
      )
      .append(
        $("<span>").html(options[i])
      );
      this_div
        .append(this_label)
        .append(feedback_string);

      this_cell.innerHTML = this_div[0].outerHTML;
    }
    this_html += this_table[0].outerHTML;

    // Veritcal Radio Buttons
  } else if (type === "radio_vertical") {
    var options = row["answers"].split("|");
    var values = row["values"].split("|");
    check_branching(values)
    for (var i = 0; i < options.length; i++) {
      feedback_string = generate_feedback_string(feedback_array,i,feedback_color,row,i);
      var this_div = $("<div>");
      this_div.addClass("custom-control").addClass("custom-radio").addClass("checkboxes");

      // create hide blocks array  // <--------------------------------------------- // Maybe a function?
      var hide_blocks = [];
      for(j=0; j < branches.length; j++){
        if(i !== j){
          hide_blocks.push(branches[j]);
        }
      }
      hide_blocks = hide_blocks.join(" ");  // <---------------------------------------------
      
      var this_label = $("<label>");
      this_label[0].htmlFor = row["item_name"] + i;
      this_label.addClass("custom-control-label").addClass("radioLabelHolder");

      this_label.append(
        $("<input>")
          .prop("type", "radio")
          .prop("id", row["item_name"] + i)
          .prop("value", values[i])
          .prop("name", survey_prepend + row["item_name"])
          .addClass("custom-control-input")
          .addClass(row["this_class"])
          .addClass("custom-control")
          .addClass("custom-radio")
          .addClass("response")
          .addClass("option-input radio")
          .addClass(row["item_name"] + "_item_row_" + row["row_no"])
          .attr("block_name", branches[i])
          .attr("hide_blocks", hide_blocks)
      )
      .append(
        $("<span>").html(options[i])
      );
      this_div
        .append(this_label)
        .append(feedback_string);

      this_html += this_div[0].outerHTML;
    }

    // Text Area
  } else if (type === "text") {
    var this_input = $("<input>");
    this_input[0].type = "text";
    this_input[0].name = survey_prepend + row["item_name"];
    this_input
    .addClass("form-control")
    .addClass(row["item_name"] + "_item row_" + row["row_no"])
    .addClass("response")
    .attr("block_name",'')
    .attr("hide_blocks",'');
    this_html += this_input[0].outerHTML;
  } else {
    // do nothing
  }

  // End of creating elements //

  // switch (type) {
  //   case "checkbox_vertical":
  //   case "radio_vertical":
  //     // do nothing
  //     break;
  //   default:
  //     this_html += generate_feedback_string(feedback_array,0,feedback_color,row);
  //     break;
  // }
  return this_html;
}

function write_survey(this_survey, this_id) {
  scoring_object.update_scales(this_survey);
  survey_html = "<table class='table_break' id='table"+current_table_no+"'>";
  this_survey_object = {
    content: [],
    shuffle_question: [],
    content_new_order: [],
    shuffled_content: [],
    shuffled_arrays: {},
  };

  for (i = 0; i < this_survey.length; i++) {
    row = this_survey[i];
    if (row["type"].toLowerCase() === "redcap_pii") {
      survey_prepend = row["item_name"].toLowerCase() + '_pii_';
      console.log("Survey contains PII, ID prefix changed to: " + survey_prepend)
      break;
    } 
  }

  // seems like the next row might be deletable, but leaving in for now: 
  survey_html += "<tr>";

  for (i = 0; i < this_survey.length; i++) {
      row = this_survey[i];
      if (row["type"].toLowerCase() === "redcap_pii") {
        // do nothing as we don't want to include any HTML
      } else {
        row_html = process_question(row, i);
        
        if(typeof(row["branch_id"]) == "undefined"){
          row["branch_id"] = "";
        }

        row_html = row_html.map(function(item){
          return item.replaceAll("<tr","<tr branch='" + row["branch"] + "'")
        });

        if(typeof(row["block"]) !== "undefined" && row["block"] !== ""){
          row_html = row_html.map(function(item){
            return item.replaceAll("<tr","<tr style='display:none' block_name='" + row["block"] + "'")
          });
        }
        
        this_survey_object.content.push(row_html[0]);
        this_survey_object.shuffle_question.push(row_html[1]);
      }
  }

  //by Camilo Martin on https://stackoverflow.com/questions/1960473/unique-values-in-an-array
  unique_shuffles = this_survey_object.shuffle_question.filter(
    (v, i, a) => a.indexOf(v) === i
  ); 

  for (var i = 0; i < unique_shuffles.length; i++) {
    if (typeof unique_shuffles[i] !== "undefined" && unique_shuffles[i] !== "none" && unique_shuffles[i] !== "") {
      shuffled_content = this_survey_object.shuffle_question
        .map(function (element, index) {
          if (typeof element !== "undefined" && element.toLowerCase() !== "none" && element.toLowerCase() === unique_shuffles[i]) {
            return this_survey_object.content[index];
          }
        })
        .filter((elm) => typeof elm !== "undefined");
      new_order = shuffle(shuffled_content);
      this_survey_object.shuffled_arrays[unique_shuffles[i]] = new_order; // add new array with dynamic name
    }
  }

  for (var i = 0; i < this_survey_object.content.length; i++) {
    var this_index = Object.keys(this_survey_object.shuffled_arrays).indexOf(
      this_survey_object.shuffle_question[i]
    );
    if (this_index !== -1) {
      //take first item off relevant list and delete item
      var this_item =
        this_survey_object.shuffled_arrays[
          Object.keys(this_survey_object.shuffled_arrays)[this_index]
        ].shift();
      this_survey_object.content_new_order[i] = this_item;
    } else {
      this_survey_object.content_new_order[i] = this_survey_object.content[i];
    }
  }

  qs_in_order = this_survey_object.content_new_order.join("");

  // below looks like it should be deleted, but leaving commented out for now
  qs_in_order = this_survey_object.content_new_order.join("</tr><tr>");
  qs_in_order += "</tr>";

  survey_html += qs_in_order;
  survey_html += "</table>";

  $("#" + this_id).html(survey_html);

  $(".response").on("change", function () {
    response_check(this);
  });

  $("#" + this_id).show(0); //scroll to top

  $(".show_tab").on("click", function () {
    if (this.className.indexOf("disabled") === -1) {
      $(".show_tab").removeClass("active");
      $(".survey_page").hide();
      $("#" + this.id.replace("_button", "")).show();
    } else {
      appropriate_message(
        "You have not yet unlocked this tab - maybe try clicking on <b>Proceed</b>?"
      );
    }
  });
}

function checkBlockNames() {

  var tableCount = $('#survey_container .table_break').length - 1;
  var hasBlockName = false;
  var hasHiddenBlockName = false;    

  setTimeout(() => {
    $('table:visible').each(function() {
      $(this).find('tr').each(function() {
          if ($(this).attr('block_name')) {
              if ($(this).is(':visible')) {
                  hasBlockName = true;
              } else {
                  hasHiddenBlockName = true;
              }
          }
      });
    });
  
    if ($('.page_break').length) {
      survey_pages_used = true;
    } else {
      // Do nothing
    }

    if (survey_pages_used && !hasBlockName) {
      if (hasHiddenBlockName) {
        $("#proceed_button").text("Proceed");
      } else {
        if (next_table_no == tableCount) {
          $("#proceed_button").text("Proceed");
        } else {
          $("#proceed_button").text("Next Page");
        }
      }
    } else if (survey_pages_used && hasBlockName) {
      if (next_table_no == tableCount) {
        $("#proceed_button").text("Proceed");
      } else {
        $("#proceed_button").text("Next Page");
      }
    } else {
      $("#proceed_button").text("Proceed");
    }
  }, 50);
}

/*
* exports for testing
*/
if (typeof module !== "undefined") {
  module.exports = {
    load_survey: load_survey,
    likert_update: survey_js.likert_update,
  };
} else {

  if (typeof Phase !== "undefined") {
    Phase.set_timer(function () {
      console.log("Phase is defined")
      checkBlockNames();
      load_survey(current_survey, "survey_outline");
    }, 50);
  } else {
    setTimeout(function () {
      console.log("Phase is not defined")
      checkBlockNames();
      load_survey(current_survey, "survey_outline");      
    }, 50);
  }
}