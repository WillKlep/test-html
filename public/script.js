$(document).ready(function() {
	$("h1").load(function(event) {
		event.preventDefault();
		//used to initially load the table
	    load_data();

	    var run_update = setInterval(load_data, 10000);

	    function load_data() {
			$.ajax({
				url: "/data",
				method: "POST",
				contentType: "application/json",
				data:{action: 'fetch'},
				sucess: function(res){
					console.log(data);
					$("h1").html(`Quote: ${res.response}`);
				}
			}) // close ajax
		} // close load_data
	});// close load
}); // close document.ready
