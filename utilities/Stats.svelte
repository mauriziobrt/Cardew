//–––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
        // Statistical Mangling, should be done in separate file
        //–––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
        // Put in a separate file later on, called stats.ts
        // Extract citations values
        // const rawData = [...this.graphData["nodes"]];
        // const citations = rawData.map(item => item.citations);

        // // Mean
        // const mean = citations.reduce((sum, val) => sum + val, 0) / citations.length;

        // // // Standard deviation (population std)
        // const std = Math.sqrt(
        //     citations.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / citations.length
        // );

        // this.statsDataset = [data["nodes"].length, data["links"].length, Math.round(mean), Math.round(std)]