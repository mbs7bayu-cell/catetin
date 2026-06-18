async function downloadLaporanPDF(bulanKey){

  const res = await fetch(
    API +
    "?mode=laporan&userId=" +
    user.userId
  );

  const hasil = await res.json();

  const data =
  hasil.bulan[bulanKey] || [];

  let totalMasuk = 0;
  let totalKeluar = 0;

  data.forEach(trx => {

    if(trx.jenis === "masuk"){

      totalMasuk += Number(trx.nominal);

    }else if(trx.jenis === "keluar"){

      totalKeluar += Number(trx.nominal);
    }

  });

  const saldo =
    totalMasuk - totalKeluar;

  const { jsPDF } =
    window.jspdf;

  const doc =
    new jsPDF();

  // HEADER

  doc.setFontSize(18);
  doc.text(
    "Catet-In",
    105,
    15,
    { align:"center" }
  );

  doc.setFontSize(13);
  doc.text(
    "Laporan Keuangan",
    105,
    23,
    { align:"center" }
  );

  // PERIODE

  const namaPeriode =
    namaBulan(bulanKey);

  const periode =
    namaPeriode;

  doc.setFontSize(10);

  doc.text(
    "Periode : " + periode,
    14,
    35
  );

  // RINGKASAN

  doc.setFontSize(11);

  doc.text(
    "Total Pemasukan",
    14,
    50
  );

  doc.text(
    ": " + formatRupiah(totalMasuk),
    55,
    50
  );

  doc.text(
    "Total Pengeluaran",
    14,
    58
  );

  doc.text(
    ": " + formatRupiah(totalKeluar),
    55,
    58
  );

  doc.text(
    "Saldo",
    14,
    66
  );

  doc.text(
    ": " + formatRupiah(saldo),
    55,
    66
  );

  // TABEL TRANSAKSI

  const rows =
    data
      .sort((a,b)=>
        parseTanggal(a) -
        parseTanggal(b)
      )
      .map(trx => [

        formatTanggalIndonesia(
          parseTanggal(trx)
        ),

        trx.kategori,

        trx.jenis,

        trx.sumber_asal_nama,

        trx.sumber_tujuan_nama,

        trx.catatan,

        formatRupiah(
          trx.nominal
        )
      ]);

  doc.autoTable({

    startY: 80,

    head: [[

      "Tanggal",
      "Kategori",
      "Jenis",
      "Sumber",
      "Tujuan",
      "Catatan",
      "Nominal"

    ]],

    body: rows,

    styles: {

      fontSize: 9
      
    },

    headStyles: {

      fillColor: [45,137,239]
    }

  });

  doc.save(
    `Laporan-${bulanKey}.pdf`
  );

}