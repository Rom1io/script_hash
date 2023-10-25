const fs = require('fs');
const { exec } = require('child_process');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const chalk = require('chalk');

// Répertoire de destination pour le fichier csv
const outputDir = './result';

// Fonction pour créer un répertoire s'il n'existe pas
function createDirectoryIfNotExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath);
    console.log(`Directory "${dirPath}" created : ${chalk.green.bold('Done')}`);
  }
}

// Fonction pour exécuter une commande shell et gérer les erreurs
function executeShellCommand(command, callback) {
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(chalk.red.bold(`Error : ${error.message}`));
      return;
    }

    if (stderr) {
      console.error(chalk.red.bold(`Error : ${stderr}`));
      return;
    }

    if (typeof callback === 'function') {
      callback(stdout);
    }
  });
}

// Vérifie et crée le répertoire de destination
createDirectoryIfNotExists(outputDir);

// Exécute la commande "ls" pour obtenir le nom et la taille en octets
const lsCommand = 'ls -l ./files | awk \'{print $5, $9}\'';

executeShellCommand(lsCommand, (sizeData) => {
  // Exécute la commande "sha256sum" pour obtenir l'empreinte de chaque fichier
  const sha256Command = 'sha256sum ./files/*';
  executeShellCommand(sha256Command, (hashData) => {
    const sizes = sizeData.trim().split('\n');
    const hashes = hashData.trim().split('\n');

    if (sizes.length !== hashes.length) {
      console.error(chalk.red.bold('Number of files and hashes does not match.'));
      return;
    }

    const csvData = [];
    for (let i = 0; i < sizes.length; i++) {
      const [size, file] = sizes[i].split(' ');
      const [hash] = hashes[i].split(' ');

      csvData.push({ 'Name': file, 'Size': size, 'Hash': hash });
    }

    // Créer le fichier CSV
    const csvFilePath = `${outputDir}/hash_file.csv`;
    const csvWriter = createCsvWriter({
      path: csvFilePath,
      header: [
        { id: 'Name', title: 'File Name' },
        { id: 'Size', title: 'Size' },
        { id: 'Hash', title: 'Hash' },
      ],
    });

    csvWriter.writeRecords(csvData)
      .then(() => {
        console.log(`CSV file "${csvFilePath}" created : ${chalk.green.bold('Done')}`);
      })
      .catch((err) => {
        console.error(`Error creating CSV file : ${err}`);
      });
  });
});
