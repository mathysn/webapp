document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById("edit-pfp-choose-file");
    const label = document.getElementById("edit-pfp-choose-file-label");

    let labelValue = label.querySelector('#edit-pfp-filename').innerHTML;

    input.addEventListener('change', function(e) {
        let filename = input.value.split( '\\' ).pop();
        console.log(`filename: ${filename}`);

        if(filename) {
            label.querySelector('#edit-pfp-filename').innerHTML = filename;
            // document.getElementById("profile-picture").src =  URL.createObjectURL(input.value); // FIXME: image not uploading to the img element
        } else {
            label.innerHTML = labelValue;
        }
    });
});