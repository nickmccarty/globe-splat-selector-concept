(async function() {
    const width = d3.select("#map").node().getBoundingClientRect().width;
    const height = 500;
    const sensitivity = 75;

    const projection = d3.geoOrthographic()
        .scale(250)
        .center([0, 0])
        .rotate([0, -30])
        .translate([width / 2, height / 2]);

    const initialScale = projection.scale();
    let path = d3.geoPath().projection(projection);

    const svg = d3.select("#map")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .style("pointer-events", "all")
        .style("user-select", "none");

    // Define gradient and shadow for the marker
    const defs = svg.append("defs");

    defs.append("radialGradient")
        .attr("id", "marker-gradient")
        .selectAll("stop")
        .data([
            { offset: "0%", color: "#ff6161" },
            { offset: "100%", color: "#ff1e1e" }
        ])
        .enter()
        .append("stop")
        .attr("offset", d => d.offset)
        .attr("stop-color", d => d.color);

    defs.append("filter")
        .attr("id", "marker-glow")
        .append("feGaussianBlur")
        .attr("stdDeviation", 4)
        .attr("result", "coloredBlur");

    const globe = svg.append("circle")
        .attr("fill", "#EEE")
        .attr("stroke", "#000")
        .attr("stroke-width", "0.2")
        .attr("cx", width / 2)
        .attr("cy", height / 2)
        .attr("r", initialScale);

    const mapGroup = svg.append("g");
    const markerGroup = svg.append("g");

    const response = await fetch("world.json"); // Replace with actual path
    const data = await response.json();

    mapGroup.append("g")
        .attr("class", "countries")
        .selectAll("path")
        .data(data.features)
        .enter().append("path")
        .attr("d", path)
        .attr("fill", "white")
        .style("stroke", "black")
        .style("stroke-width", 0.3)
        .style("opacity", 0.8);

    // Add marker for Sequim, Washington
    const sequimCoords = [-123.101, 48.079];
    const addMarker = () => {
        const sequimPoint = projection(sequimCoords);

        markerGroup.selectAll(".marker").remove(); // Clear existing marker

        markerGroup.append("circle")
            .attr("class", "marker")
            .attr("cx", sequimPoint[0])
            .attr("cy", sequimPoint[1])
            .attr("r", 10) // Marker size
            .style("fill", "url(#marker-gradient)") // Gradient fill
            .style("filter", "url(#marker-glow)") // Glow effect
            .style("pointer-events", "all") // Ensure marker is clickable
            .on("click", () => {
                // Redirect to viewer page with the specific .splat file
                window.location.href = 'viewer-page.html?url=sequim-shipwreck.splat';
            });
    };
    
    addMarker();

    svg.call(d3.drag().on("drag", (event) => {
        const rotate = projection.rotate();
        const k = sensitivity / projection.scale();
        projection.rotate([
            rotate[0] + event.dx * k,
            rotate[1] - event.dy * k
        ]);
        path = d3.geoPath().projection(projection);
        mapGroup.selectAll("path").attr("d", path);
        addMarker(); // Re-position marker during drag
    }));

    svg.call(d3.zoom().on("zoom", (event) => {
        if (event.transform.k > 0.3) {
            projection.scale(initialScale * event.transform.k);
            path = d3.geoPath().projection(projection);
            mapGroup.selectAll("path").attr("d", path);
            globe.attr("r", projection.scale());
            addMarker(); // Re-position marker during zoom
        } else {
            event.transform.k = 0.3;
        }
    }));

    d3.timer(() => {
        const rotate = projection.rotate();
        const k = sensitivity / projection.scale();
        projection.rotate([rotate[0] - 0.5 * k, rotate[1]]);
        path = d3.geoPath().projection(projection);
        mapGroup.selectAll("path").attr("d", path);
        addMarker(); // Re-position marker during rotation
    });
})();