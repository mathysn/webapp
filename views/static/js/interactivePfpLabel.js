const input = document.getElementById("edit-pfp-choose-file");
const label = document.getElementById("edit-pfp-choose-file-label");

let labelValue = label.innerHTML;

// FIXME: not working

input.addEventListener('change', function(e) {
    let filename = input.value.split( '/' ).pop();
    console.log(`filename: ${filename}`);

    if(filename) {
        label.querySelector('span').innerHTML = filename;
    } else {
        label.innerHTML = labelValue;
    }
});

