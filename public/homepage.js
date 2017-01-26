
$('#searchBtn').click(function() {
    var searchTerm = $("#search").val();
    console.log(searchTerm)
    $.ajax({
      type: "GET",
      url: "/api/restos/" + searchTerm,

    }).done(function(data) {
      location.reload();
    })

  });
