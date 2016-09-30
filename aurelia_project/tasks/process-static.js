import gulp from 'gulp';
import project from '../aurelia.json';

export default function processStatic() {
   return gulp.src(project.staticProcessor.source)
    .pipe(gulp.dest(project.platform.output));

};
