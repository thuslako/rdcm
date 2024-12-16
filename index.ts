const {glob} = require('glob');
const fs = require('fs-extra');
const path = require('path');

const generateComponentMap = async (rootDir) => {
  const componentMap = new Map();

  const findComponents =  (dir) => {
   return glob(`${dir}/**/*.{js,jsx,ts,tsx}`, {});
  };

  const files = await findComponents(rootDir);

  files?.forEach((file) => {
    const componentName = path.basename(file, path.extname(file));
    const componentPath = path.resolve(file);
    const componentKey = `${componentName}@${componentPath}`; 

    componentMap.set(componentKey, {
      name: componentName,
      path: componentPath,
      dependencies: [],
      dependents: [],
    });
    // Extract dependencies
    const fileContent = fs.readFileSync(file, 'utf-8');
    const importRegex = /import\s*\{(.*?)\}\s*from\s*['"](.+?)['"]/gm; 
    const matches = fileContent.matchAll(importRegex);

  
    for (const match of matches) {
      const importedComponents = match[1].split(',').map((c) => c.trim());

      const currentComponentData = componentMap.get(componentKey);
      currentComponentData.dependencies.push(...importedComponents); 
      componentMap.set(componentKey, currentComponentData);
    }
  });

  // Calculate dependents after all components are processed
  componentMap.forEach((componentData, componentKey) => {
    componentData.dependencies.forEach((dependency) => {
      const matchingComponents = Array.from(componentMap.entries())
        .filter(([key, _]) => _.name === dependency)
        .map(([key, _]) => key);

      matchingComponents.forEach((dependencyKey) => {
        const dependencyData = componentMap.get(dependencyKey);
        dependencyData.dependents.push(componentData.name);
        componentMap.set(dependencyKey, dependencyData);
      });
    });
  });

  const mapData = Object.fromEntries(componentMap)
  fs.writeFileSync("./componentMap.json", JSON.stringify(mapData, null, 2));
};


module.exports = {
  generateComponentMap
};

generateComponentMap("./project/app/javascript");