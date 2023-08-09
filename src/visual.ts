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

interface Annotation {
    id: number,
    x: number,
    y: number,
    value: number,
    date: Date,
    text: string
}

export class Visual implements IVisual {
    private target: HTMLElement;
    private settings: VisualSettings;
    private container: d3.Selection<HTMLDivElement, any, HTMLDivElement, any>;
    private annotations: Annotation[];

    constructor(options: VisualConstructorOptions) {
        console.log('Visual constructor', options);
        this.target = options.element;

        /** Create the chart container when the visual loads */
        this.container = d3.select(this.target)
            .append('div')
                .attr('id', 'my_dataviz');

        this.annotations = [];
    }

    public update(options: VisualUpdateOptions) {
        console.log('Visual update', options);
        this.settings = Visual.parseSettings(options && options.dataViews && options.dataViews[0]);
        let settings = this.settings;
        if (!settings.AnnotationSettings.SaveLocations) {
            this.annotations = [];
        }

        console.log(this.settings);
        
        // Clear down existing plot
        this.container.selectAll('*').remove();

        // Remove tooltip in case of glitch
        d3.select('body').selectAll('div.tooltip').remove();

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

        const hasAllTypes: boolean = [dateIndex, numberIndex].every((index) => index !== -1);
            
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

        // Determine if data includes monthly or daily values
        const timeDifferences = []
        let timeType = {
            monthly: false,
            daily: false
        };

        for (let i = 1; i < data.length; i++) {
            let timeDiff = data[i].date.getTime() - data[i - 1].date.getTime();
            timeDiff = timeDiff / (1000 * 60 * 60 * 24); // Convert milliseconds to days
            timeDifferences.push(timeDiff);
        }

        timeDifferences.forEach((diff) => {
            if (diff >= 28) {
                timeType.monthly = true;
            } else {
                timeType.daily = true;
            }
        });

        // Group data by month
        function groupDataByMonth(data: chartRow[]): Map<string, chartRow[]> {
            const groupedData = new Map<string, chartRow[]>();
          
            for (const dataPoint of data) {
              const monthYear = `${dataPoint.date.getMonth() + 1}-${dataPoint.date.getFullYear()}`;
              if (!groupedData.has(monthYear)) {
                groupedData.set(monthYear, []);
              }
              groupedData.get(monthYear)?.push(dataPoint);
            }
          
            return groupedData;
        }

        // Group data by year
        function groupDataByYear(data: chartRow[]): Map<number, chartRow[]> {
            const groupedData: Map<number, chartRow[]> = new Map();
          
            data.forEach((dataPoint) => {
              const year = dataPoint.date.getFullYear();
          
              if (groupedData.has(year)) {
                groupedData.get(year)!.push(dataPoint);
              } else {
                groupedData.set(year, [dataPoint]);
              }
            });
          
            return groupedData;
          }

        const groupedDataMonthly = groupDataByMonth(data);
        const groupedDataYearly = groupDataByYear(data);


        // Set the dimensions and margins of the graph
        let ls = settings.LayoutSettings;
        var margin = {top: ls.ChartTopMargin, right: ls.ChartRightMargin, bottom: ls.ChartBottomMargin, left: ls.ChartLeftMargin},
            width = options.viewport.width - margin.left - margin.right,
            height = options.viewport.height - margin.top - margin.bottom;

        // create tooltip div
        const tooltip = d3.select("body")
            .append("div")
            .attr("class", "tooltip")
            .style("background-color", this.settings.TooltipSettings.TooltipColour);

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
            .classed('x-axis-g', true)  
            .attr('transform', 'translate(0,' + height + ')')
            .call(d3.axisBottom(x)
                .tickFormat(function(date : Date){
                    //if (d3.timeYear(date) < date) {
                        return d3.timeFormat('%b-%y')(date);
                    //} else {
                        //return d3.timeFormat('%Y')(date);
                    //}
                })
                .ticks(this.settings.XAxisSettings.TickCount))
            .call(g => {
                g.selectAll('.x-axis-g path') // Select the y-axis line
                    .attr('stroke', settings.LayoutSettings.AxisColor); 
                g.selectAll('.x-axis-g line') // Select tick mark lines
                    .attr('stroke', settings.LayoutSettings.AxisColor);
                // font settings
                g.selectAll('.x-axis-g text')
                    .style('fill', this.settings.XAxisSettings.FontColor)
                    .style('font-family', this.settings.XAxisSettings.FontFamily)
                    .style('font-size', this.settings.XAxisSettings.FontSize);

                g.selectAll('.x-axis-g text')
                    .attr('transform', `translate(${this.settings.XAxisSettings.XOffset}, ${-this.settings.XAxisSettings.YOffset}) rotate(-${this.settings.XAxisSettings.LabelAngle})`)
                    .style('text-anchor', this.settings.XAxisSettings.LabelAngle ? 'end' : 'middle');
            });

        // Set Y axis values
        let minvalue = this.settings.YAxisSettings.MinValue;
        let maxvalue = d3.max(data, function(d) { return +d.value; });
        let graphMaxvalue = this.settings.YAxisSettings.MaxValue <= maxvalue ? maxvalue: this.settings.YAxisSettings.MaxValue;

        var y = d3.scaleLinear()
            .domain([minvalue, graphMaxvalue])
            .range([ height, 0 ]);
        
        // Add Y axis
        svg.append('g')
            .classed('y-axis-g', true)
            .call(d3.axisLeft(y)
                    .tickFormat(data => {
                        // formats y-axis labels with appropriate units
                        return nFormatter(parseInt(data.toString()), this.settings.YAxisSettings.DisplayDigits, this.settings.YAxisSettings.DisplayUnits);
                    })
                .ticks(this.settings.YAxisSettings.TickCount)
                .tickSize(settings.LayoutSettings.ToggleGridLines ? -width : 6))
            .call(_ => {
                if (settings.LayoutSettings.ToggleGridLines) {
                    d3.selectAll('line')
                        .attr('stroke-dasharray', '1,3')
                        .attr('stroke', settings.LayoutSettings.AxisColor)
                        .attr('stroke-width', +settings.LayoutSettings.ToggleGridLines)
                        .style('fill', settings.LayoutSettings.AxisColor);
                }
                d3.selectAll('.y-axis-g text')
                    .style('fill', this.settings.YAxisSettings.FontColor)
                    .style('font-family', this.settings.YAxisSettings.FontFamily)
                    .style('font-size', this.settings.YAxisSettings.FontSize); 
                })
            .call(g => {
                g.selectAll('.y-axis-g path') // Select the y-axis line
                    .attr('stroke', settings.LayoutSettings.AxisColor); 
                g.selectAll('.y-axis-g line') // Select tick mark lines
                    .attr('stroke', settings.LayoutSettings.AxisColor);
            });

        
        function nFormatter(num: number, digits: number, displayUnits: string): string {
            // converts 15,000 to 15k and etc
            let si = [
                { value: 1, symbol: '', text: 'none' },
                { value: 1E3, symbol: 'K', text: 'thousands' },
                { value: 1E6, symbol: 'M', text: 'millions' },
                { value: 1E9, symbol: 'B', text: 'billions' },
                { value: 1E12, symbol: 'T', text: 'trillions' },
                { value: 1E15, symbol: 'P', text: 'quadrillions' },
                { value: 1E18, symbol: 'E', text: 'quintillions' }
            ];

            let i;
            // converts numbers into largest reasonable units unless otherwise specified
            if (displayUnits == 'auto') {
                for (i = si.length - 1; i > 0; i--) {
                    if (num >= si[i].value) {
                        break;
                    }
                }
            } else {
                for (i = 0; i < si.length - 1; i++) {
                    if (displayUnits == si[i].text) {
                        break;
                    }
                }
            }
            return parseFloat((num / si[i].value).toFixed(digits)).toLocaleString() + si[i].symbol;
        }

        // Add the line
        svg.append('path')
            .datum(data)
                .attr('fill', 'none')
                .attr('stroke', settings.LineSettings.LineColor)
                .attr('stroke-width', settings.LineSettings.LineThickness)
                .attr('d', d3.line<chartRow>()
                    .x(function(d) { return x(d.date) })
                    .y(function(d) { return y(d.value) })
                )


        // Add a circle element

        const circle = svg.append("circle")
            .attr("r", 0)
            .attr("fill", this.settings.TooltipSettings.TooltipColour)
            .style("stroke", "white")
            .attr("opacity", .70)
            .style("pointer-events", "none");

        const listeningRect = svg.append("rect")
            .attr("width", width)
            .attr("height", height);
        
        if (this.settings.TooltipSettings.ToggleTooltip) {
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
                    .style("left", `${xPos > (width / 2) ? (xPos - 85) : xPos + 75}px`)
                    .style("top", `${yPos + 30}px`)
                    .style("color", settings.TooltipSettings.TextColour)
                    //.style("font-size", settings.TooltipSettings.TextSize + 'px')
                    .html(`<strong>Date:</strong> ${d.date.toLocaleDateString('en-US')}<br>
                            <strong>Value:</strong> ${d.value !== undefined ? d.value.toFixed(2) : 'N/A'}<br>
                            ${d.annotation !== null && d.annotation != undefined ? d.annotation : ''}`)
            });

            // listening rectangle mouse leave function
            listeningRect.on("mouseleave", function () {
                circle.transition()
                    .duration(50)
                    .attr("r", 0);

                tooltip.style("display", "none");
            });
        }

        // Point Labels
        if (this.settings.PointLabels.TogglePointLabels) {
            let groupedData: Map<number | string, chartRow[]>;
            if (settings.PointLabels.Frequency == 'monthly') {
                groupedData = groupedDataMonthly;
            } else if (settings.PointLabels.Frequency == 'yearly') {
                groupedData = groupedDataYearly;
            }

            let isMax = settings.PointLabels.Value == 'max';

            // const sortedDataPoints = groupedDataYearly.get(2022).slice().sort((a, b) => b.value - a.value);
            // console.log(sortedDataPoints);
            // Take the nth point from this sorted list after doing it for each year/month.

            groupedData.forEach((dataPoints) => {
                let currentVal;
                let n = settings.PointLabels.nValue;

                // for (const dataPoint of dataPoints) {
                //     if (isMax? dataPoint.value >= currentVal.value : dataPoint.value <= currentVal.value) {
                //         currentVal = dataPoint;
                //     }
                // }

                // Sort data to get nth value
                const sortedData = dataPoints.slice().sort((a, b) => b.value - a.value);
                console.log(sortedData);

                if (n > sortedData.length) {
                    n = sortedData.length;
                } else if (n < 1) {
                    n = 1;
                }

                if (isMax) {
                    currentVal = sortedData[n - 1];
                } else {
                    currentVal = sortedData[sortedData.length - n];
                }

                svg.append("circle")
                    .attr("class", "graphPoint")
                    .attr("fill", settings.LineSettings.LineColor)
                    .attr("cx", x(currentVal.date))
                    .attr("cy", y(currentVal.value))
                    .attr("r", 5);

                svg.append('text')
                    .attr('fill', settings.PointLabels.FontColor)
                    .attr('font-size', settings.PointLabels.FontSize)
                    .attr('font-family', settings.PointLabels.FontFamily)
                    .attr('dominant-baseline', 'middle')
                    .attr('y', y(currentVal.value) - settings.PointLabels.YOffset)
                    .attr('x', x(currentVal.date) + settings.PointLabels.XOffset)
                    .text(Math.round(currentVal.value * 10) / 10);
            });
            
        }

        // Growth Indicator
        if (this.settings.GrowthIndicator.ToggleGrowthIndicator) {
            // Get data points selected
            let selector1 = this.settings.GrowthIndicator.Selector1;
            let selector2 = this.settings.GrowthIndicator.Selector2;

            // Determine default position for selector
            let defaultPoint1: chartRow;
            let defaultPoint2: chartRow;
            if (groupedDataMonthly.size >= 2) {
                const month2 = Array.from(groupedDataMonthly.keys()).pop();
                const month1 = Array.from(groupedDataMonthly.keys()).slice(-2, -1).pop();

                const month1Data = groupedDataMonthly.get(month1);
                const month2Data = groupedDataMonthly.get(month2);

                defaultPoint1 = month1Data[0];

                for (const dataPoint of month1Data) {
                    if (dataPoint.value >= defaultPoint1.value) {
                        defaultPoint1 = dataPoint;
                    }
                }

                defaultPoint2 = month2Data[0];

                for (const dataPoint of month2Data) {
                    if (dataPoint.value >= defaultPoint2.value) {
                        defaultPoint2 = dataPoint;
                    }
                }

            } else {
                defaultPoint1 = data[data.length - 2];
                defaultPoint2 = data[data.length - 1];
            }

            // Check if selectors are valid and find their index
            let growthPoint1 = (selector1 && (getIndex(selector1, data) != -1)) ? data[getIndex(selector1, data)] : defaultPoint1;
            let growthPoint2 = (selector2 && (getIndex(selector2, data) != -1)) ? data[getIndex(selector2, data)] : defaultPoint2;
            
            // let growthPoint1 = data[s1Index];
            // let growthPoint2 = data[s2Index];

            console.log(growthPoint1);
            console.log(growthPoint2);

            // Draw circles on points selected
            let growthCircle1 = svg.append("circle")
                .attr("class", "graphPoint")
                .attr("fill", settings.LineSettings.LineColor)
                .attr("cx", x(growthPoint1.date))
                .attr("cy", y(growthPoint1.value))
                .attr("r", 5);

            let growthCircle2 = svg.append("circle")
                .attr("class", "graphPoint")
                .attr("fill", settings.LineSettings.LineColor)
                .attr("cx", x(growthPoint2.date))
                .attr("cy", y(growthPoint2.value))
                .attr("r", 5);

            // Create path
            let widthOffset = settings.GrowthIndicator.LineOffsetWidth;
            let path = d3.line()([
                [x(growthPoint1.date), y(growthPoint1.value)],
                [width + widthOffset, y(growthPoint1.value)],
                [width + widthOffset, y(growthPoint2.value)],
                [x(growthPoint2.date), y(growthPoint2.value)]
            ]);

            // Draw path
            svg.append('path')
                .attr('fill', 'none')
                .attr('stroke', settings.GrowthIndicator.LineColor)
                .attr('stroke-width', settings.GrowthIndicator.LineSize)
                .attr('stroke-dasharray', '5,4')
                .attr('d', path);

            let growthPercent = (growthPoint2.value - growthPoint1.value) / growthPoint1.value * 100;
            growthPercent = Math.round(growthPercent * 10) / 10;
            let growthPercentStr;
            if (!settings.PrimaryLabelSettings.ShowSign) {
                growthPercentStr = Math.abs(growthPercent);
            } else {
                growthPercentStr = growthPercent > 0 ? '+' + growthPercent : growthPercent;
            }
            let increasing = growthPercent > 0 ? true : false;
            let minY = (y(growthPoint1.value) >= y(growthPoint2.value)) ? y(growthPoint2.value) : y(growthPoint1.value);
            let maxY = (y(growthPoint1.value) >= y(growthPoint2.value)) ? y(growthPoint1.value) : y(growthPoint2.value);

            if (settings.GrowthIndicator.ShowArrowLine) {
                // Arrowhead
                if (this.settings.GrowthIndicator.ShowArrow) {
                    svg.append('path')
                        .attr('d', d3.symbol().type(d3.symbolTriangle).size(this.settings.GrowthIndicator.ArrowSize))
                        .attr('fill', growthPercent > 0 ? this.settings.GrowthIndicator.IncreasingColour : this.settings.GrowthIndicator.DecreasingColour)
                        .attr('transform', `translate(${width + widthOffset}, ${increasing ? minY : maxY}) rotate(${increasing ? 0 : 60})`);
                }

                let arrowLine = svg.append('line')
                    .attr('x1', width + widthOffset)
                    .attr('y1', y(growthPoint1.value))
                    .attr('x2', width + widthOffset)
                    .attr('y2', y(growthPoint2.value))
                    .attr('stroke', growthPercent >= 0 ? this.settings.GrowthIndicator.IncreasingColour : this.settings.GrowthIndicator.DecreasingColour)
                    .attr('stroke-width', settings.GrowthIndicator.LineSize + 1);
            }
            if (settings.PrimaryLabelSettings.ToggleBgShape) {
                let textWidth = getTextWidth(growthPercentStr.toString() + '%', settings.PrimaryLabelSettings);
                let growthEllipse = svg.append('ellipse')
                    .attr('rx', settings.PrimaryLabelSettings.LabelMinWidth + 10 > textWidth ? settings.PrimaryLabelSettings.LabelMinWidth : textWidth - 10) // resizes label based on text width
                    .attr('ry', settings.PrimaryLabelSettings.LabelHeight)
                    .attr('cx', width + widthOffset + settings.PrimaryLabelSettings.LabelOffsetWidth)
                    .attr('cy', (y(growthPoint1.value) + y(growthPoint2.value)) / 2)
                    .attr('fill', settings.PrimaryLabelSettings.LabelBackgroundColor)
                    .attr('stroke', settings.PrimaryLabelSettings.BorderColor)
                    .attr('stroke-width', settings.PrimaryLabelSettings.BorderSize);
            }

            let growthText = svg.append('text')
                .attr('fill', settings.PrimaryLabelSettings.FontColor)
                .attr('font-size', settings.PrimaryLabelSettings.FontSize)
                .attr('font-family', settings.PrimaryLabelSettings.FontFamily)
                .attr('text-anchor', 'middle')
                .attr('dominant-baseline', 'middle')
                .attr('y', (y(growthPoint1.value) + y(growthPoint2.value)) / 2)
                .attr('x', width + widthOffset + settings.PrimaryLabelSettings.LabelOffsetWidth)
                .text(growthPercentStr + '%');

        }

        // Secondary Growth Indicator
        if (settings.SecondaryGrowthIndicator.ToggleGrowthIndicator) {
            // Get data points selected
            let selector1 = this.settings.SecondaryGrowthIndicator.Selector1;
            let selector2 = this.settings.SecondaryGrowthIndicator.Selector2;

            // Determine default position for selector
            let defaultPoint1: chartRow;
            let defaultPoint2: chartRow;
            if (groupedDataMonthly.size > 12) {
                const month2 = Array.from(groupedDataMonthly.keys()).pop();
                const month1 = Array.from(groupedDataMonthly.keys()).slice(-13, -12).pop();
                console.log(groupedDataMonthly);
                console.log(month2);

                const month1Data = groupedDataMonthly.get(month1);
                const month2Data = groupedDataMonthly.get(month2);

                defaultPoint1 = month1Data[0];

                for (const dataPoint of month1Data) {
                    if (dataPoint.value >= defaultPoint1.value) {
                        defaultPoint1 = dataPoint;
                    }
                }

                defaultPoint2 = month2Data[0];

                for (const dataPoint of month2Data) {
                    if (dataPoint.value >= defaultPoint2.value) {
                        defaultPoint2 = dataPoint;
                    }
                }

            } else if (groupedDataMonthly.size >= 2) {
                const month2 = Array.from(groupedDataMonthly.keys()).pop();
                const month1 = Array.from(groupedDataMonthly.keys()).slice(-2, -1).pop();

                const month1Data = groupedDataMonthly.get(month1);
                const month2Data = groupedDataMonthly.get(month2);

                defaultPoint1 = month1Data[0];

                for (const dataPoint of month1Data) {
                    if (dataPoint.value >= defaultPoint1.value) {
                        defaultPoint1 = dataPoint;
                    }
                }

                defaultPoint2 = month2Data[0];

                for (const dataPoint of month2Data) {
                    if (dataPoint.value >= defaultPoint2.value) {
                        defaultPoint2 = dataPoint;
                    }
                }

            } else {
                defaultPoint1 = data[data.length - 2];
                defaultPoint2 = data[data.length - 1];
            }

            // Check if selectors are valid and find their index
            let growthPoint1 = (selector1 && (getIndex(selector1, data) != -1)) ? data[getIndex(selector1, data)] : defaultPoint1;
            let growthPoint2 = (selector2 && (getIndex(selector2, data) != -1)) ? data[getIndex(selector2, data)] : defaultPoint2;
           
            // Draw circles on points selected
            let growthCircle1 = svg.append("circle")
                .attr("class", "graphPoint")
                .attr("fill", settings.LineSettings.LineColor)
                .attr("cx", x(growthPoint1.date))
                .attr("cy", y(growthPoint1.value))
                .attr("r", 5);

            let growthCircle2 = svg.append("circle")
                .attr("class", "graphPoint")
                .attr("fill", settings.LineSettings.LineColor)
                .attr("cx", x(growthPoint2.date))
                .attr("cy", y(growthPoint2.value))
                .attr("r", 5);

            // Create path
            let heightOffset = settings.SecondaryGrowthIndicator.LineOffsetHeight;
            let top = (settings.SecondaryLabelSettings.Location == 'top');
            let lineY = top ? y(y.domain()[1]) + heightOffset : y(settings.YAxisSettings.MinValue) - heightOffset;
            let path = d3.line()([
                [x(growthPoint1.date), y(growthPoint1.value)],
                [x(growthPoint1.date),  lineY],
                [x(growthPoint2.date), lineY],
                [x(growthPoint2.date), y(growthPoint2.value)]
            ]);

            // Draw path
            svg.append('path')
                .attr('fill', 'none')
                .attr('stroke', settings.SecondaryGrowthIndicator.LineColor)
                .attr('stroke-width', settings.SecondaryGrowthIndicator.LineSize)
                .attr('stroke-dasharray', '5,4')
                .attr('d', path);

            let growthPercent = (growthPoint2.value - growthPoint1.value) / growthPoint1.value * 100;
            growthPercent = Math.round(growthPercent * 10) / 10;
            let growthPercentStr;
            if (!settings.SecondaryLabelSettings.ShowSign) {
                growthPercentStr = Math.abs(growthPercent);
            } else {
                growthPercentStr = growthPercent > 0 ? '+' + growthPercent : growthPercent;
            }

            let increasing = growthPercent > 0 ? true : false;
            let averageX = (x(growthPoint1.date) + x(growthPoint2.date)) / 2;

            if (settings.SecondaryLabelSettings.ToggleBgShape) {
                let textWidth = getTextWidth(growthPercentStr.toString() + '%', settings.SecondaryLabelSettings);
                let growthEllipse = svg.append('ellipse')
                    .attr('rx', settings.SecondaryLabelSettings.LabelMinWidth + 10 > textWidth ? settings.SecondaryLabelSettings.LabelMinWidth : textWidth - 10) // resizes label based on text width
                    .attr('ry', settings.SecondaryLabelSettings.LabelHeight)
                    .attr('cx', averageX)
                    .attr('cy', lineY - settings.SecondaryLabelSettings.LabelOffsetHeight)
                    .attr('fill', settings.SecondaryLabelSettings.LabelBackgroundColor)
                    .attr('stroke', settings.SecondaryLabelSettings.BorderColor)
                    .attr('stroke-width', settings.SecondaryLabelSettings.BorderSize);
            }

            let growthText = svg.append('text')
                .attr('width', settings.SecondaryLabelSettings.LabelMinWidth)
                .attr('height', settings.SecondaryLabelSettings.LabelHeight)
                .attr('fill', settings.SecondaryLabelSettings.FontColor)
                .attr('font-size', settings.SecondaryLabelSettings.FontSize)
                .attr('font-family', settings.SecondaryLabelSettings.FontFamily)
                .attr('text-anchor', 'middle')
                .attr('dominant-baseline', 'middle')
                .attr('y', lineY - settings.SecondaryLabelSettings.LabelOffsetHeight)
                .attr('x', averageX)
                .text(growthPercentStr.toString() + '%');

            let rotation = settings.SecondaryLabelSettings.Location == 'top' ? 60 : 0;
            let arrowOffset = settings.SecondaryLabelSettings.Location == 'top' ? -settings.SecondaryGrowthIndicator.ArrowOffset : settings.SecondaryGrowthIndicator.ArrowOffset
            switch (settings.SecondaryGrowthIndicator.DisplayArrow) {
                case 'left':
                    // draw first arrow
                    drawTriangle(x(growthPoint1.date), y(growthPoint1.value) + arrowOffset, settings.SecondaryGrowthIndicator, rotation);
                    break;

                case 'right':
                    // draw second arrow
                    drawTriangle(x(growthPoint2.date), y(growthPoint2.value) + arrowOffset, settings.SecondaryGrowthIndicator, rotation);
                    break;

                case 'both':
                    // draw first arrow
                    drawTriangle(x(growthPoint1.date), y(growthPoint1.value) + arrowOffset, settings.SecondaryGrowthIndicator, rotation);
                    // draw second arrow
                    drawTriangle(x(growthPoint2.date), y(growthPoint2.value) + arrowOffset, settings.SecondaryGrowthIndicator, rotation);
                    break;

                default:
                    break;
            }
        }

        // draws triangles/arrows on the svg
        function drawTriangle(x: number, y: number, settings: any, rotation: number) {
            /* 
            * Param: x coord, y coord, settings, rotation 
            * Returns: none
            */
            svg.append('path')
                .attr('d', d3.symbol().type(d3.symbolTriangle).size(settings.ArrowSize))
                .attr('fill', settings.LineColor)
                .attr('transform', `translate(${x}, ${y}) rotate(${rotation})`);
        }

        // gets displayed width of text
        function getTextWidth(text: string, settings: any): number {
            /* 
            * Param: selector, settings
            * Returns: width of text based on font size and family
            */
            try {
                let fontFamily = settings.FontFamily;
                let fontSize = settings.FontSize;

                let font = fontSize + 'px ' + fontFamily;

                let canvas = document.createElement('canvas');
                let context = canvas.getContext("2d");
                context.font = font;

                return context.measureText(text).width;
            } catch (e) {
                console.error(e);
            }
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
            //.on("start", dragstarted)
            .on("drag", dragged)
            //.on("end", dragended);

        // function dragstarted(event, d) {
        //     d3.select(this).raise().attr("stroke", "black");
        // }
            
        function dragged(event, d) {
            d3.select(this).attr("cx", d.x = event.x).attr("cy", d.y = event.y);
            update();
        }
            
        // function dragended(event, d) {
        //     d3.select(this).attr("stroke", null);
        // }

        //let annotations = []

        // Loop through rows to create annotations
        if (this.annotations.length == 0) {
            data.forEach((row, idx) => {
                if (row.annotation != null) {
                    this.annotations.push({
                        id: this.annotations.length,
                        x: x(row.date),
                        y: y(row.value),
                        value: row.value,
                        date: row.date,
                        text: row.annotation
                    });
                }
            });
        } 

        console.log(this.annotations);

        let annotations = this.annotations;

        function calculateRotationAngle(graphX, graphY, annotationX, annotationY) {
            const deltaX = graphX - annotationX;
            const deltaY = graphY - annotationY;
            const angleRad = Math.atan2(deltaY, deltaX); // Calculate the angle in radians using Math.atan2
            const angleDeg = (angleRad * 180) / Math.PI; // Convert the angle from radians to degrees
            return angleDeg;
        }
        
        // Update annotation after being dragged
        function update() {
            let fontsize = settings.AnnotationSettings.FontSize;
            let yOffset = -settings.AnnotationSettings.YOffset;
            let xOffset = settings.AnnotationSettings.XOffset;

            svg.selectAll('.annotationText')
                .data(annotations)
                .join('text')
                .attr('x', function(d: Annotation) { return d.x + xOffset; })
                .attr('y', function(d: Annotation) { return d.y + yOffset; })
                .attr('font-size', fontsize)
                .style('fill', settings.AnnotationSettings.FontColor)
                .style('font-family', settings.AnnotationSettings.FontFamily)
                .text(function(d: Annotation) { return d.text; });
                //.call(drag);
            
            svg.selectAll('.annotationLine')
                .data(annotations)
                .join(
                    enter => enter.append('line')
                        .classed('annotationLine', true)
                        .attr("x1", function(d: Annotation) { return x(d.date); })
                        .attr("y1", function(d: Annotation) { return y(d.value); })
                        .attr("x2", function(d: Annotation) { return d.x; })
                        .attr("y2", function(d: Annotation) { return d.y; })
                        .attr('stroke', settings.AnnotationSettings.LineColor)
                        .attr('stroke-width', settings.AnnotationSettings.LineThickness),
                    update => update.attr("x1", function(d: Annotation) { return x(d.date); })
                        .attr("y1", function(d: Annotation) { return y(d.value); })
                        .attr("x2", function(d: Annotation) { 
                            return d.x + d.text.length * (fontsize / 4.5) + xOffset; 
                        })
                        .attr("y2", function(d: Annotation) { 
                            return (d.y > (y(d.value) - yOffset) ? d.y - fontsize + yOffset : d.y + yOffset + fontsize / 2);
                        })
                );
            
            // set line type (if dashed is selected)
            if (settings.AnnotationSettings.LineStyle == 'dashed') {
                svg.selectAll('.annotationLine')
                    .attr('stroke-dasharray', '5,4');
            }

            if (settings.AnnotationSettings.ShowArrow) {
                svg.selectAll('.annotationArrow')
                    .data(annotations)
                    .join(
                        enter => enter.append('path')
                            .classed('annotationArrow', true)
                            .attr('d', d3.symbol().type(d3.symbolTriangle).size(60))
                            .attr('fill', settings.AnnotationSettings.LineColor)
                            .attr('transform', (d) => `translate(${x(d.date)}, ${d.y > y(d.value) ? y(d.value) + 2 : y(d.value) - 2}) rotate(${calculateRotationAngle(x(d.date), y(d.value), d.x, (d.y > y(d.value) ? d.y - fontsize : d.y + fontsize / 2))})`),
                        update => update.attr('transform', (d) => `translate(${x(d.date)}, ${d.y > y(d.value) ? y(d.value) + 2 : y(d.value) - 2}) rotate(${calculateRotationAngle(x(d.date), y(d.value), d.x, (d.y > y(d.value) ? d.y - fontsize : d.y + fontsize / 2))})`)
                    );
            }
        }

        if (settings.AnnotationSettings.ToggleAnnotations && commentIndex >= 0){
            let yOffset = -settings.AnnotationSettings.YOffset;
            let xOffset = settings.AnnotationSettings.XOffset;
            // update();

            svg.selectAll('.annotationText')
                .data(this.annotations)
                .join('text')
                .classed('annotationText', true)
                .attr('x', function(d) { return d.x + xOffset; })
                .attr('y', function(d) { return d.y + yOffset; })
                .attr('font-size', settings.AnnotationSettings.FontSize)
                .style('fill', settings.AnnotationSettings.FontColor)
                .style('font-family', settings.AnnotationSettings.FontFamily)
                .text(function(d) { return d.text; });
                
            svg.selectAll('.annotationText')
                .call(drag);

            svg.selectAll('.annotationLine')
            .data(this.annotations)
            .join(
                enter => enter.append('line')
                    .classed('annotationLine', true)
                    .attr("x1", function(d: Annotation) { return x(d.date); })
                    .attr("y1", function(d: Annotation) { return y(d.value); })
                    .attr("x2", function(d: Annotation) { 
                        return d.x + d.text.length * (settings.AnnotationSettings.FontSize / 4.5) + xOffset; 
                    })
                    .attr("y2", function(d: Annotation) { 
                        return (d.y > (y(d.value) - yOffset) ? d.y - settings.AnnotationSettings.FontSize + yOffset : d.y + yOffset + settings.AnnotationSettings.FontSize / 2);
                    })
                    .attr('stroke', settings.AnnotationSettings.LineColor)
                    .attr('stroke-width', settings.AnnotationSettings.LineThickness),
                update => update.attr("x1", function(d: Annotation) { return x(d.date); })
                    .attr("y1", function(d: Annotation) { return y(d.value); })
                    .attr("x2", function(d: Annotation) { 
                        return d.x + d.text.length * (settings.AnnotationSettings.FontSize / 4.5); 
                    })
                    .attr("y2", function(d: Annotation) { 
                        return (d.y > (y(d.value) - yOffset) ? d.y - settings.AnnotationSettings.FontSize : d.y + settings.AnnotationSettings.FontSize / 2);
                    })
            );
        
            // set line type (if dashed is selected)
            if (settings.AnnotationSettings.LineStyle == 'dashed') {
                svg.selectAll('.annotationLine')
                    .attr('stroke-dasharray', '5,4');
            }

            if (settings.AnnotationSettings.ShowArrow){
                svg.selectAll('.annotationArrow')
                    .data(this.annotations)
                    .join(
                        enter => enter.append('path')
                            .classed('annotationArrow', true)
                            .attr('d', d3.symbol().type(d3.symbolTriangle).size(this.settings.AnnotationSettings.ArrowSize))
                            .attr('fill', this.settings.AnnotationSettings.LineColor)
                            .attr('transform', (d) => `translate(${x(d.date)}, ${d.y > y(d.value) ? y(d.value) + 2 : y(d.value) - 2}) rotate(${calculateRotationAngle(x(d.date), y(d.value), d.x, (d.y > y(d.value) ? d.y - settings.AnnotationSettings.FontSize : d.y + settings.AnnotationSettings.FontSize / 2))})`),
                        update => update.attr('transform', (d) => `translate(${x(d.date)}, ${d.y > y(d.value) ? y(d.value) + 2 : y(d.value) - 2}) rotate(${calculateRotationAngle(x(d.date), y(d.value), d.x, (d.y > y(d.value) ? d.y - settings.AnnotationSettings.FontSize : d.y + settings.AnnotationSettings.FontSize / 2))})`)
                    );
            }
        }

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