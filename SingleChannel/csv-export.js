(function () {
  var NativeWorker = window.Worker;
  if (NativeWorker) {
    window.Worker = function () {
      var worker = new (Function.prototype.bind.apply(NativeWorker, [null].concat(Array.prototype.slice.call(arguments))))();
      worker.addEventListener('message', function (event) {
        if (event.data && event.data.singletraces && event.data.CVdata) {
          window.singleChannelData = event.data;
        }
      });
      return worker;
    };
    window.Worker.prototype = NativeWorker.prototype;
  }

  function downloadDataCsv() {
    var data = window.singleChannelData;
    if (!data) return;

    var rows = [
      ['parameter', 'value'],
      ['number_of_channels', data.n],
      ['ensemble_size', data.ensembleSize],
      ['driving_force_V', data.u],
      ['single_channel_conductance_pS', data.conductance],
      ['excitation_duration_ms', data.duration],
      ['measurement_duration_ms', data.maxTime],
      ['time_step_ms', data.timeStep],
      ['noise_SD_pA', data.singlechannelNoise],
      ['random_seed', data.randomSeed],
      []
    ];
    var traceHeader = ['time_ms'];
    for (var channel = 0; channel < data.singletraces.length; channel++) {
      traceHeader.push('channel_' + (channel + 1) + '_current_pA');
    }
    traceHeader.push('sum_current_pA', 'ensemble_mean_current_pA', 'ensemble_variance_pA2');
    rows.push(traceHeader);

    var sampleCount = Math.max(data.meantrace.length, data.means.length, data.variances.length);
    for (var sample = 0; sample < sampleCount; sample++) {
      var row = [sample * data.timeStep];
      for (var trace = 0; trace < data.singletraces.length; trace++) {
        row.push(data.singletraces[trace][sample] == null ? '' : data.singletraces[trace][sample]);
      }
      row.push(
        data.meantrace[sample] == null ? '' : data.meantrace[sample],
        data.means[sample] == null ? '' : data.means[sample].y,
        data.variances[sample] == null ? '' : data.variances[sample].y
      );
      rows.push(row);
    }

    rows.push([], ['mean_current_pA', 'variance_pA2']);
    data.CVdata.forEach(function (point) { rows.push([point.x, point.y]); });

    var blob = new Blob([rows.map(function (row) { return row.join(','); }).join('\r\n') + '\r\n'], {
      type: 'text/csv;charset=utf-8'
    });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = 'SingleChannel_data.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  window.addEventListener('DOMContentLoaded', function () {
    document.getElementById('downloadData').addEventListener('click', downloadDataCsv);
  });
}());
