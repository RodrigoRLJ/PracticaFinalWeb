import PDFDocument from 'pdfkit';

export const generateDeliveryNotePDF = (note) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const chunks = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header
        doc.fontSize(20).font('Helvetica-Bold').text('ALBARÁN', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(12).font('Helvetica').text(`Nº: ${note.deliveryNoteNumber}`, { align: 'center' });
        doc.moveDown(1.5);

        // Client
        doc.fontSize(14).font('Helvetica-Bold').text('Cliente');
        doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
        doc.moveDown(0.3);
        doc.fontSize(11).font('Helvetica');
        if (note.clientId) {
            doc.text(`Nombre: ${note.clientId.name ?? '-'}`);
            doc.text(`CIF: ${note.clientId.cif ?? '-'}`);
        }
        doc.moveDown(1);

        // Project
        doc.fontSize(14).font('Helvetica-Bold').text('Proyecto');
        doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
        doc.moveDown(0.3);
        doc.fontSize(11).font('Helvetica');
        if (note.project) {
            doc.text(`Nombre: ${note.project.name ?? '-'}`);
            doc.text(`Código: ${note.project.projectCode ?? '-'}`);
        }
        doc.moveDown(1);

        // Details
        doc.fontSize(14).font('Helvetica-Bold').text('Detalles del albarán');
        doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
        doc.moveDown(0.3);
        doc.fontSize(11).font('Helvetica');

        if (note.workdate) {
            doc.text(`Fecha de trabajo: ${new Date(note.workdate).toLocaleDateString('es-ES')}`);
        }
        if (note.description) {
            doc.text(`Descripción: ${note.description}`);
        }

        doc.text(`Formato: ${note.format}`);

        if (note.format === 'hours') {
            doc.text(`Horas: ${note.hours ?? '-'}`);
        } else {
            doc.text(`Cantidad: ${note.quantity ?? '-'}`);
            if (note.unit)      doc.text(`Unidad: ${note.unit}`);
        }

        if (note.unitPrice !== undefined && note.unitPrice !== null) {
            doc.text(`Precio unitario: ${note.unitPrice} €`);
        }
        doc.moveDown(1);

        // Signature
        doc.fontSize(14).font('Helvetica-Bold').text('Firma');
        doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
        doc.moveDown(0.3);
        doc.fontSize(11).font('Helvetica');

        if (!note.pending && note.sign) {
            doc.text('Estado: Firmado');
            if (note.sign.startsWith('data:image')) {
                const base64Data = note.sign.split(',')[1];
                const imgBuffer = Buffer.from(base64Data, 'base64');
                doc.image(imgBuffer, { width: 200 });
            } else {
                doc.text(`Firma: ${note.sign}`);
            }
        } else {
            doc.text('Estado: Pendiente de firma');
            doc.moveDown(3);
            doc.moveTo(50, doc.y).lineTo(250, doc.y).stroke();
            doc.text('Firma del cliente', 50, doc.y + 5);
        }

        doc.end();
    });
};
