"use strict";

import "core-js/stable";
import "./../style/visual.less";
import powerbi from "powerbi-visuals-api";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import DataView = powerbi.DataView;
import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;
import { VisualSettings } from "./settings";
import * as d3 from 'd3';


interface chartRow {
    date: Date,
    value: number,
    annotation: string
};

export class Visual implements IVisual {
    private target: HTMLElement;
    private settings: VisualSettings;
    private container: d3.Selection<HTMLDivElement, any, HTMLDivElement, any>;

    constructor(options: VisualConstructorOptions) {
        console.log('Visual constructor', options);
        this.target = options.element;

        /** Create the chart container when the visual loads */
        this.container = d3.select(this.target)
            .append('div')
                .attr('id', 'my_dataviz');
    }

    public update(options: VisualUpdateOptions) {
        console.log('Visual update', options);
        this.settings = Visual.parseSettings(options && options.dataViews && options.dataViews[0]);

        console.log(this.settings);
        
        // Clear down existing plot
        this.container.selectAll('*').remove();

        console.log(options.dataViews);

        // Test 1: Data view has both fields added
        let dataViews = options.dataViews;
        console.log(dataViews);
        console.log('Test 1: Valid data view...');
        if (!dataViews
            || !dataViews[0]
            || !dataViews[0].table
            || !dataViews[0].table.rows
            || !dataViews[0].metadata
        ) {
            console.log('Test 1 FAILED. No data to draw table.');
            return;
        }
    
        // If we get this far, we can trust that we can work with the data
        let table = dataViews[0].table;

        // Get indeces of date, comment, and number 
        // (can be in different order depending on how the data was uploaded)
        const dateIndex: number = table.columns.findIndex((item) => item.type.dateTime);
        const commentIndex: number = table.columns.findIndex((item) => item.type.text);
        const numberIndex: number = table.columns.findIndex((item) => item.type.numeric);

        // Convert the date string to Date type
        const newDates: Date[] = table.rows.map((row: any[]) => {
            const dateString: string = row[dateIndex] as string;
            return new Date(dateString);
        });

        const hasAllTypes: boolean = [dateIndex, commentIndex, numberIndex].every((index) => index !== -1);
            
        // Test 2: Category matches our expected data type (dateTime)
        console.log('Test 2: Table row has all 3 types...');
        if (!hasAllTypes) {
            console.log('Test 2 FAILED. Incorrect data type.');
            return;
        }
    
        // Map our data into an array.
        // We're going to map the `table.rows` array in-place and return
        // an `chartRow` object for each entry. Because the values array elements
        // correspond with their equivalent `table.rows` element, we can use
        // the current index to get the value as we map.
        let data: chartRow[] = table.rows.map(
            (row, idx) => (
                {
                    date: <Date>newDates[idx],
                    value: <number>row[numberIndex],
                    annotation: <string>row[commentIndex]
                }
            )
        );
    
        // Parse our mapped data and view the output 
        console.log(data);

        // Set the dimensions and margins of the graph
        var margin = {top: 10, right: 60, bottom: 30, left: 60},
            width = options.viewport.width - margin.left - margin.right,
            height = options.viewport.height - margin.top - margin.bottom;

        // create tooltip div

        const tooltip = d3.select("body")
            .append("div")
            .attr("class", "tooltip");

        // Append the svg object to the body of the page
        var svg = this.container
            .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
            .append("g")
                .attr("transform",
                    "translate(" + margin.left + "," + margin.top + ")");
                                
        // Set X axis values (date format)
        var x = d3.scaleTime()
            .domain(d3.extent(data, function(d) { return d.date; }))
            .range([ 0, width ]);

        // Add X axis
        svg.append('g')
            .attr('transform', 'translate(0,' + height + ')')
            .call(d3.axisBottom(x));

        // Set Y axis values
        let minvalue = d3.min(data, function(d) { return +d.value; });
        let maxvalue = d3.max(data, function(d) { return +d.value; });
        let range = maxvalue - minvalue;

        var y = d3.scaleLinear()
            .domain([0, maxvalue + range / 2])
            .range([ height, 0 ]);
        
        // Add Y axis
        svg.append('g')
            .call(d3.axisLeft(y));

        // Add the line
        svg.append('path')
            .datum(data)
                .attr('fill', 'none')
                .attr('stroke', 'steelblue')
                .attr('stroke-width', 1.5)
                .attr('d', d3.line<chartRow>()
                    .x(function(d) { return x(d.date) })
                    .y(function(d) { return y(d.value) })
                )


        // Add a circle element

        const circle = svg.append("circle")
            .attr("r", 0)
            .attr("fill", "steelblue")
            .style("stroke", "white")
            .attr("opacity", .70)
            .style("pointer-events", "none");


        const listeningRect = svg.append("rect")
            .attr("width", width)
            .attr("height", height);

        // create the mouse move function

        listeningRect.on("mousemove", function (event) {
            const [xCoord] = d3.pointer(event, this);
            const bisectDate = d3.bisector(function(d: chartRow) { return d.date }).left;
            const x0 = x.invert(xCoord);
            const i = bisectDate(data, x0, 1);
            const d0 = data[i - 1];
            const d1 = data[i];
            const d = x0.valueOf() - d0.date.valueOf() > d1.date.valueOf() - x0.valueOf() ? d1 : d0;
            const xPos = x(d.date);
            const yPos = y(d.value);

            // Update the circle position
            circle.attr("cx", xPos)
                .attr("cy", yPos);

             // Add transition for the circle radius
            circle.transition()
                .duration(50)
                .attr("r", 5);

            // add in our tooltip
            tooltip
                .style("display", "block")
                .style("left", `${xPos > (width / 2) ? xPos - 75 : xPos + 75}px`)
                .style("top", `${yPos + 30}px`)
                .html(`<strong>Date:</strong> ${d.date.toLocaleDateString('en-US')}<br>
                        <strong>Value:</strong> ${d.value !== undefined ? d.value.toFixed(2) : 'N/A'}<br>
                        ${d.annotation !== null ? d.annotation : ''}`)
        });

        // listening rectangle mouse leave function

        listeningRect.on("mouseleave", function () {
            circle.transition()
                .duration(50)
                .attr("r", 0);

            tooltip.style("display", "none");
        });

        // Growth Indicator
        if (this.settings.GrowthIndicator.ToggleGrowthIndicator) {
            // Get data points selected
            let selector1 = this.settings.GrowthIndicator.Selector1;
            let selector2 = this.settings.GrowthIndicator.Selector2;

            // Check if selectors are valid and find their index
            let s1Index = (selector1 && (getIndex(selector1, data) != -1)) ? getIndex(selector1, data) : data.length - 2;
            let s2Index = (selector2 && (getIndex(selector2, data) != -1)) ? getIndex(selector2, data) : data.length - 1;
            
            let growthPoint1 = data[s1Index];
            let growthPoint2 = data[s2Index];

            console.log(growthPoint1);
            console.log(growthPoint2);

            // Draw circles on points selected
            let growthCircle1 = svg.append("circle")
                .attr("class", "graphPoint")
                .attr("cx", x(growthPoint1.date))
                .attr("cy", y(growthPoint1.value))
                .attr("r", 5);

            let growthCircle2 = svg.append("circle")
                .attr("class", "graphPoint")
                .attr("cx", x(growthPoint2.date))
                .attr("cy", y(growthPoint2.value))
                .attr("r", 5);

            // Create path
            let widthOffset = 15;
            let path = d3.line()([
                [x(growthPoint1.date), y(growthPoint1.value)],
                [width + widthOffset, y(growthPoint1.value)],
                [width + widthOffset, y(growthPoint2.value)],
                [x(growthPoint2.date), y(growthPoint2.value)]
            ]);

            // Draw path
            svg.append('path')
                .attr('fill', 'none')
                .attr('stroke', 'black')
                .attr('stroke-width', '1')
                .attr('stroke-dasharray', '5,4')
                .attr('d', path);

            let growthPercent = (growthPoint2.value - growthPoint1.value) / growthPoint1.value * 100;
            growthPercent = Math.round(growthPercent * 10) / 10;
            let growthPercentStr = growthPercent > 0 ? '+' + growthPercent : growthPercent;

            let increasing = growthPercent > 0 ? true : false;
            let minY = (y(growthPoint1.value) >= y(growthPoint2.value)) ? y(growthPoint2.value) : y(growthPoint1.value);
            let maxY = (y(growthPoint1.value) >= y(growthPoint2.value)) ? y(growthPoint1.value) : y(growthPoint2.value);

            // Arrowhead
            if (Math.abs(growthPercent) >= 2.5) {
                svg.append('path')
                    .attr('d', d3.symbol().type(d3.symbolTriangle).size(50))
                    .attr('fill', growthPercent > 0 ? 'limegreen' : 'red')
                    .attr('transform', `translate(${width + widthOffset}, ${increasing ? minY : maxY}) rotate(${increasing ? 0 : 60})`);
            }

            let arrowLine = svg.append('line')
                .attr('x1', width + widthOffset)
                .attr('y1', y(growthPoint1.value))
                .attr('x2', width + widthOffset)
                .attr('y2', y(growthPoint2.value))
                .attr('stroke', growthPercent >= 0 ? 'limegreen' : 'red')
                .attr('stroke-width', 2);

            let growthText = svg.append('text')
                .attr('fill', 'black')
                .attr('font-size', 12)
                .attr('dominant-baseline', 'middle')
                .attr('y', (y(growthPoint1.value) + y(growthPoint2.value)) / 2)
                .attr('x', width + widthOffset + 5)
                .text(growthPercentStr + '%');

        }


        // get index of selector
        function getIndex(selector: string, dataArray: chartRow[]): number {
            /* 
            * Param: selector, dataArray
            * Returns: corresponding column index in data table
            */
            let selectorIdx = -1; 
            const selectorDate = new Date(selector);

            dataArray.forEach((data, idx) => {
                if (data.date.toLocaleDateString('en-US') == selectorDate.toLocaleDateString('en-US')) {
                    selectorIdx = idx;
                }
            });

            return selectorIdx;
        }


        // Drag functionality
        let drag = d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended);

        function dragstarted(event, d) {
            d3.select(this).raise().attr("stroke", "black");
        }
            
        function dragged(event, d) {
            d3.select(this).attr("cx", d.x = event.x).attr("cy", d.y = event.y);
            update();
        }
            
        function dragended(event, d) {
            d3.select(this).attr("stroke", null);
        }

        let annotations = []

        // Count the number of existing text and line elements
        const existingTextCount = svg.selectAll('text').size();
        const existingLineCount = svg.selectAll('line').size();

        // Loop through rows to create annotations
        data.forEach((row, idx) => {
            if (row.annotation != null) {
                annotations.push({
                    id: annotations.length,
                    x: x(row.date),
                    y: y(row.value),
                    graphx: x(row.date),
                    graphy: y(row.value),
                    value: row.value,
                    text: row.annotation
                });
            }
        });

        console.log(annotations);

        // Filter out the text/line elements based on their indices, 
        //  so that only the annotations are included
        let newTextElements = svg.selectAll('text')
            .filter(function(_, i) {
                return i >= existingTextCount;
            });
        let newLineElements = svg.selectAll('line')
            .filter(function(_, i) {
                return i >= existingLineCount;
            });
        
        // Update annotation after being dragged
        function update (){
            let fontsize = 11;

            newTextElements
                .data(annotations)
                .join('text')
                .attr('x', function(d) { return d.x; })
                .attr('y', function(d) { return d.y; })
                .attr('font-size', fontsize)
                .text(function(d) { return d.text; })
                .call(drag);

            newLineElements
                .data(annotations)
                .join(
                    enter => enter.append('line')
                        .attr("x1", function(d) { return d.graphx; })
                        .attr("y1", function(d) { return d.graphy; })
                        .attr("x2", function(d) { return d.graphx; })
                        .attr("y2", function(d) { return d.graphy; })
                        .attr('stroke', 'black')
                        .attr('stroke-width', 1),
                    update => update.attr("x1", function(d) { return d.graphx; })
                        .attr("y1", function(d) { return d.graphy; })
                        .attr("x2", function(d) { 
                            return d.x + d.text.length * (fontsize / 4.5); 
                        })
                        .attr("y2", function(d) { 
                            return (d.y > d.graphy ? d.y - fontsize : d.y + fontsize / 2);
                        })
                );       
        }

        update();

        // Update the newTextElements and newLineElements variables to include the annotations
        newTextElements = svg.selectAll('text')
            .filter(function(_, i) {
                return i >= existingTextCount;
            });

        newLineElements = svg.selectAll('line')
            .filter(function(_, i) {
                return i >= existingLineCount;
            });

    }

    private static parseSettings(dataView: DataView): VisualSettings {
        return VisualSettings.parse(dataView) as VisualSettings;
    }

    /**
     * This function gets called for each of the objects defined in the capabilities files and allows you to select which of the
     * objects and properties you want to expose to the users in the property pane.
     *
     */
     public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {
        return VisualSettings.enumerateObjectInstances(this.settings || VisualSettings.getDefault(), options);
    }
}