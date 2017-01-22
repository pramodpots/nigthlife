$(document).ready(function() {


  /*$("#restaurants").on("click", ".going", function() {

          $(this).toggleClass('btn-success btn-danger');
          if ($(this).text() == 'Going') {
            $(this).text('Not Going');
          }
          else {
            $(this).text('Going')
          }
  });*/

  
  $('#searchBtn').click(function() {
    var searchTerm = $("#search").val();
    $('#restaurants').html(' ');

    $.ajax({
      url: 'https://maps.googleapis.com/maps/api/geocode/json?address=' + searchTerm + '&key=AIzaSyDliVHqw1Sief3cEcVmnHtrKdq0MY03p7k',
      dataType: "json",
      success: function(data) {
        var location = data.results[0].geometry.location;
        var item = {
          "city": location,
          "searchterm": searchTerm
        }
        $.ajax({
          type: 'POST',
          data: JSON.stringify(item),
          contentType: 'application/json',
          url: '/search',
          success: function(data) {
            console.log('success');
            //location.reload();
            window.location = "/"
            //console.log(data);
            // data.forEach(function(r) {
            //   var list = '<form action="/add/resto" method="post"><div class="media col-md-8 col-md-offset-2 sizeing"><div class="media-left"><a href="#"><img class="media-object" src="' + r.logo + '" width="100px" height="100"></a></div><div class="media-body"><h2 class="media-heading">' + r.name + '</h2>' + r.cuisines + '</div><div class="media-right"><input type="text" class="hidden" value="'+r.resto_id+'" name="resto_id"><button type="submit" class="going btn btn-success" style="width:100px; height:100px"><span class="count">0</span> Going</button></div></div>'
            //   $('#restaurants').append(list);
            // })
          }
        });
      }
    })

  });
});
