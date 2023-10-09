const url = '/static/assets/CV_Mathys_NOURRY.pdf';

pdfjsLib.getDocument(url).promise.then(function(pdf) {
    pdf.getPage(1).then(function(page) {
        const canvas = document.getElementById('pdf');
        const viewport = page.getViewport({scale: 3});

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const ctx = canvas.getContext('2d');
        const renderContext = {
            canvasContext: ctx,
            viewport: viewport
        };
        page.render(renderContext);
    });
});