var url = '/static/assets/CV_Mathys_NOURRY.pdf';

pdfjsLib.getDocument(url).promise.then(function(pdf) {
    pdf.getPage(1).then(function(page) {
        var canvas = document.getElementById('pdf');
        var viewport = page.getViewport({ scale: 3});

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        var ctx = canvas.getContext('2d');
        var renderContext = {
            canvasContext: ctx,
            viewport: viewport
        };
        page.render(renderContext);
    });
});