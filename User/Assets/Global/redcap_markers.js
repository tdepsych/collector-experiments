function REDCap_Markers() {
    for (let i = 0; i <= parent.parent.project_json.phase_no; i++) {
      parent.parent.project_json.repeat_no = i;
      console.log("Instance:");
      Phase.add_response({
        phase_number: i,
        username: parent.parent.$("#participant_code").val(),
        complete: 2
      });
    }
  }