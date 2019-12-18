$(document).ready(function () {
  $("#btnScrape").on("click", function () {
    $.get("/scrape", function (data) {
      console.log("Done Scraping!");
      window.location.href = "/";
    }).then(() => {

    })
  });

  $("#btnClear").on("click", function () {
    $.ajax({
      url: '/clear',
      type: 'DELETE'
    });
    $("#goalRows").empty();
  });

  function getGoals() {
    // Grab the goal summaries as a json
    $.getJSON("/api/goalSummaries", function (data) {
      $("#goalRows").empty();
      for (let i = 0; i < data.length; i++) {
        let newRow = $("<tr>");
        let newGoalNum = $('<td scope="row">').text(i + 1);
        let newGoalScorer = $('<td class="goalScorer">').text(data[i].G);
        let newGoalAssist1 = $("<td>").text(data[i].A1);
        let newGoalAssist2 = $("<td>").text(data[i].A2);
        let newGoalStrength = $("<td>").text(data[i].Strength);
        let newGoalType = $("<td>").text(data[i].Type);
        let newGoalPlus = $("<td>").text(data[i].Plus.join(", "));
        let newGoalMinus = $("<td>").text(data[i].Minus.join(", "));
        let newGoalTime = $('<td class="goalTime">').text(data[i].Time);
        let newGoalNoteCell = $("<td data>");
        let newGoalNote = $('<button class="goalNote btn btn-primary" data-id="' + data[i]._id + '">Add Note</button>')
        newGoalNoteCell.append(newGoalNote);
        newRow.append(newGoalNum);
        newRow.append(newGoalScorer);
        newRow.append(newGoalAssist1);
        newRow.append(newGoalAssist2);
        newRow.append(newGoalStrength);
        newRow.append(newGoalType);
        newRow.append(newGoalPlus);
        newRow.append(newGoalMinus);
        newRow.append(newGoalTime);
        newRow.append(newGoalNoteCell);
        // Display the apropos information on the page
        $("#goalRows").append(newRow);
      }
    });
  }

  getGoals();
  // Whenever someone clicks a p tag
  $(document).on("click", ".goalNote", function () {
    // Empty the notes from the note section
    $("#notes").empty();
    $("#modalNote").modal("toggle");
    $("#modal-title").text("GOAL: " + $(this).parent().parent().find(".goalScorer").text() + " - " + $(this).parent().parent().find(".goalTime").text());
    // Save the id from the p tag
    var thisId = $(this).attr("data-id");

    // Now make an ajax call for the Article
    $.ajax({
      method: "GET",
      url: "/api/goalSummaries/" + thisId
    })
      // With that done, add the note information to the page
      .then(function (data) {
        console.log(data);
        $("#notes").append("<h5>").text("Note:");
        // An input to enter a new title
        $("#notes").append("<input id='titleinput' class='form-control' type='text' name='title' >");
        // A button to submit a new note, with the id of the article saved to it
        $("#notes").append("<button data-id='" + data._id + "' id='savenote' class='btn btn-primary'>Save Note</button>");

        // If there's a note in the article
        if (data.note) {
          // Place the title of the note in the title input
          $("#titleinput").val(data.note.title);
        }
      });
  });

  // When you click the savenote button
  $(document).on("click", "#savenote", function (event) {
    event.preventDefault();
    // Grab the id associated with the article from the submit button
    var thisId = $(this).attr("data-id");
    console.log(thisId);
    // Run a POST request to change the note, using what's entered in the inputs
    $.ajax({
      method: "POST",
      url: "/api/goalSummaries/" + thisId,
      data: {
        // Value taken from title input
        title: $("#titleinput").val()
      }
    })
      // With that done
      .then(function (data) {
        // Log the response
        console.log(data);
        // Empty the notes section
        $("#savenote").addClass("btn-success");
      });
  });

  $("#tbPlayerSearch").on("keyup", event => {
    $("td").css("background-color", "inherit");
    if ($("#tbPlayerSearch").val() !== "") {
      var tdList = $("td").filter(function () {
        return $(this).text().toLowerCase().indexOf($("#tbPlayerSearch").val().toLowerCase()) > -1;
      })
      tdList.css("background-color", "green");
    }
  })
});