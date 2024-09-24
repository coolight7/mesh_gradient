import 'package:flutter/material.dart';
import 'package:mesh_gradient/mesh_gradient.dart';
import 'package:my_util_base/MyUtil.dart';

class AnimatedMeshGradientView extends StatelessWidget {
  static final time = MyObj_c<double>(0);
  const AnimatedMeshGradientView({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: const BoxConstraints.expand(),
      child: AnimatedMeshGradient(
        time: time,
        colors: const [
          Colors.red,
          Colors.blue,
          Colors.green,
          Colors.yellow,
        ],
        options: AnimatedMeshGradientOptions(speed: 0.01),
      ),
    );
  }
}
